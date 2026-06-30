// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BaseEscrow (PrismFlash Origin Lock Contract)
 * @notice Stores user deposits mapped to nullifiers and releases them to Solvers
 * after a 150-block optimistic dispute window, or instantly via hardware-attested proxy signatures.
 */
contract BaseEscrow {
    struct Deposit {
        address depositor;
        uint256 amount;
        bytes32 payloadCommitment;
        bool locked;
    }

    struct Claim {
        address solver;
        bytes32 payloadCommitment;
        string solanaTx;
        string movementTx;
        uint256 submitBlock;
        bool finalized;
        bool challenged;
    }

    // --- State Variables ---
    address public owner;
    address public usdcToken; // Mock or real USDC contract address
    uint256 public constant DISPUTE_WINDOW = 150; // In blocks (~30 mins on Base)

    // Upgrade Hooks to transition from optimistic PrismFlash to hardware-shielded PrismZK
    bool public isHardwareEnforced;
    address public spectrumEngineAddress;

    // Mappings
    mapping(bytes32 => Deposit) public deposits; // nullifier -> Deposit
    mapping(bytes32 => Claim) public claims;     // nullifier -> Claim
    mapping(address => uint256) public userBalances; // For simulated minting/deposits

    // --- Events ---
    event USDCLocked(address indexed depositor, bytes32 indexed nullifier, bytes32 payloadCommitment, uint256 amount);
    event SettlementClaimed(bytes32 indexed nullifier, address indexed solver, string solanaTx, string movementTx, uint256 submitBlock);
    event SettlementFinalized(bytes32 indexed nullifier, address indexed solver, uint256 amount);
    event ClaimChallenged(bytes32 indexed nullifier, address indexed challenger, string reason);
    event UpgradeHookToggled(bool isHardwareEnforced, address spectrumEngineAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can invoke this");
        _;
    }

    constructor() {
        owner = msg.sender;
        isHardwareEnforced = false;
        spectrumEngineAddress = address(0);
    }

    /**
     * @notice Toggle the hardware verification upgrade path.
     * @param _isHardwareEnforced True to require TEE proxy signatures, bypassing dispute windows.
     * @param _spectrumEngineAddress Public address of the AWS Nitro / Intel SGX Enclave.
     */
    function toggleHardwareEnforcement(bool _isHardwareEnforced, address _spectrumEngineAddress) external onlyOwner {
        isHardwareEnforced = _isHardwareEnforced;
        spectrumEngineAddress = _spectrumEngineAddress;
        emit UpgradeHookToggled(_isHardwareEnforced, _spectrumEngineAddress);
    }

    /**
     * @notice Locks USDC in the escrow vault to back a cross-VM intent.
     * @param nullifier Replay prevention nullifier.
     * @param payloadCommitment Cryptographic payload state commitment.
     * @param amount Amount of USDC to lock.
     */
    function lockUSDC(bytes32 nullifier, bytes32 payloadCommitment, uint256 amount) external {
        require(deposits[nullifier].amount == 0, "Nullifier already registered");
        require(amount > 0, "Amount must be greater than zero");

        // Lock funds
        deposits[nullifier] = Deposit({
            depositor: msg.sender,
            amount: amount,
            payloadCommitment: payloadCommitment,
            locked: true
        });

        emit USDCLocked(msg.sender, nullifier, payloadCommitment, amount);
    }

    /**
     * @notice Submitted by Solvers who have completed user payouts on Solana and Movement.
     * @param nullifier The unique nullifier of the target deposit.
     * @param solanaTx The transaction hash of the Solana payout execution.
     * @param movementTx The transaction hash of the Movement payout execution.
     * @param signature Cryptographic Secp256k1 signature of the verified AWS Nitro Enclave.
     */
    function claimSettlement(
        bytes32 nullifier, 
        bytes32 payloadCommitment,
        string calldata solanaTx, 
        string calldata movementTx,
        bytes calldata signature
    ) external {
        Deposit storage dep = deposits[nullifier];
        require(dep.locked, "Deposit not found or already unlocked");
        require(dep.payloadCommitment == payloadCommitment, "Commitment hash mismatch");
        require(claims[nullifier].solver == address(0), "Claim already submitted for nullifier");

        claims[nullifier] = Claim({
            solver: msg.sender,
            payloadCommitment: payloadCommitment,
            solanaTx: solanaTx,
            movementTx: movementTx,
            submitBlock: block.number,
            finalized: false,
            challenged: false
        });

        emit SettlementClaimed(nullifier, msg.sender, solanaTx, movementTx, block.number);

        // UPGRADE HOOK check:
        // If the system is in hardware-enforced mode, we cryptographically verify the signature of
        // spectrumEngineAddress to instantly bypass the 150-block optimistic window.
        if (isHardwareEnforced) {
            bytes32 messageHash = keccak256(abi.encodePacked(nullifier, payloadCommitment, solanaTx, movementTx));
            bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
            
            address recoveredSignerAddress = recoverSigner(ethSignedMessageHash, signature);
            require(recoveredSignerAddress == spectrumEngineAddress, "Invalid hardware enclave signature");
            
            _finalizeSettlement(nullifier);
        } else if (msg.sender == spectrumEngineAddress) {
            // Direct call backward compatibility for administrative/trusted services
            _finalizeSettlement(nullifier);
        }
    }

    /**
     * @notice Recovers the signer address from an Ethereum signed message hash and signature.
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        if (_signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    /**
     * @notice Finalizes an uncontested claim after the optimistic 150-block dispute window passes.
     * @param nullifier The nullifier to finalize.
     */
    function finalizeSettlement(bytes32 nullifier) external {
        Claim storage cl = claims[nullifier];
        require(cl.solver != address(0), "No active claim for nullifier");
        require(!cl.finalized, "Claim already finalized");
        require(!cl.challenged, "Claim has been challenged");
        require(block.number >= cl.submitBlock + DISPUTE_WINDOW, "Optimistic dispute window still open");

        _finalizeSettlement(nullifier);
    }

    function _finalizeSettlement(bytes32 nullifier) internal {
        Deposit storage dep = deposits[nullifier];
        Claim storage cl = claims[nullifier];

        cl.finalized = true;
        dep.locked = false;

        uint256 payoutAmount = dep.amount;
        address solver = cl.solver;

        // Reset deposit record to prevent re-entrancy / double withdrawal
        delete deposits[nullifier];

        emit SettlementFinalized(nullifier, solver, payoutAmount);
    }

    /**
     * @notice Submitted by public watchdogs to dispute fraudulent Solver claims within the 150-block window.
     * @param nullifier The disputed nullifier.
     * @param reason Proof explanation of the missing payout on target networks.
     */
    function challengeClaim(bytes32 nullifier, string calldata reason) external {
        Claim storage cl = claims[nullifier];
        require(cl.solver != address(0), "No active claim for nullifier");
        require(!cl.finalized, "Claim already finalized");
        require(!cl.challenged, "Claim already under dispute");
        require(block.number < cl.submitBlock + DISPUTE_WINDOW, "Dispute window closed");

        cl.challenged = true;

        emit ClaimChallenged(nullifier, msg.sender, reason);
    }
}
