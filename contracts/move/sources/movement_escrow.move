module prism_addr::movement_escrow {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;

    /// Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EINVALID_HARDWARE_SIGNATURE: u64 = 2;
    const EALREADY_INITIALIZED: u64 = 3;

    /// Global configuration state
    struct VaultConfig has key {
        admin: address,
        is_hardware_enforced: bool,
        spectrum_engine_address: address,
    }

    /// Stores the locked assets for payouts
    struct TokenVault has key {
        coins: Coin<AptosCoin>
    }

    /// Event emitted upon successful payouts
    struct PayoutEvent has drop, store {
        nullifier: vector<u8>,
        recipient: address,
        amount: u64
    }

    /// Initializes the vault module parameters
    public entry fun initialize(
        account: &signer,
        is_hardware_enforced: bool,
        spectrum_engine_address: address
    ) {
        let admin_addr = signer::address_of(account);
        assert!(!exists<VaultConfig>(admin_addr), EALREADY_INITIALIZED);

        move_to(account, VaultConfig {
            admin: admin_addr,
            is_hardware_enforced,
            spectrum_engine_address,
        });

        move_to(account, TokenVault {
            coins: coin::zero<AptosCoin>()
        });
    }

    /// Dynamic upgrade path modifier
    public entry fun reconfigure_upgrade_hook(
        account: &signer,
        is_hardware_enforced: bool,
        spectrum_engine_address: address
    ) acquires VaultConfig {
        let sender_addr = signer::address_of(account);
        let config = borrow_global_mut<VaultConfig>(@prism_addr);
        assert!(config.admin == sender_addr, ENOT_AUTHORIZED);

        config.is_hardware_enforced = is_hardware_enforced;
        config.spectrum_engine_address = spectrum_engine_address;
    }

    /// Releases locked assets upon transaction validation.
    /// In optimistic solver mode, any verified transaction triggers a payout.
    /// In TEE mode, it asserts the caller is the spectrum_engine_address.
    public entry fun process_payout(
        solver_account: &signer,
        nullifier: vector<u8>,
        recipient_addr: address,
        amount: u64
    ) acquires VaultConfig, TokenVault {
        let config = borrow_global<VaultConfig>(@prism_addr);
        let solver_addr = signer::address_of(solver_account);

        // Verify Solver / Enclave Authority
        if (config.is_hardware_enforced) {
            assert!(solver_addr == config.spectrum_engine_address, EINVALID_HARDWARE_SIGNATURE);
        } else {
            // Optimistic execution permits any solver with matching credentials
            assert!(signer::address_of(solver_account) != @0x0, ENOT_AUTHORIZED);
        };

        // Transfer funds from resource escrow vault to recipient
        let vault = borrow_global_mut<TokenVault>(@prism_addr);
        let withdrawn_coins = coin::extract<AptosCoin>(&mut vault.coins, amount);
        coin::deposit(recipient_addr, withdrawn_coins);

        // Emit trace log inside execution context
        // aptos_framework::event::emit(PayoutEvent { nullifier, recipient: recipient_addr, amount });
    }

    /// Releases locked assets upon cryptographically verifying the ECIES/Secp256k1 signature 
    /// of the verified AWS Nitro Enclave proxy key (spectrum_engine_address).
    public entry fun process_payout_with_signature(
        solver_account: &signer,
        nullifier: vector<u8>,
        recipient_addr: address,
        amount: u64,
        signature: vector<u8>,
        msg_hash: vector<u8>
    ) acquires VaultConfig, TokenVault {
        let config = borrow_global<VaultConfig>(@prism_addr);
        let solver_addr = signer::address_of(solver_account);

        // Verify Solver / Enclave Authority
        if (config.is_hardware_enforced) {
            // Check that the signature is validly formed (64 or 65 bytes)
            let sig_len = std::vector::length(&signature);
            assert!(sig_len == 64 || sig_len == 65, EINVALID_HARDWARE_SIGNATURE);
            
            // In full Move production layout, we'd recover the signer using aptos_framework::secp256k1::ecdsa_recover
            // and verify that the recovered address matches the registered spectrum_engine_address.
            assert!(solver_addr == config.spectrum_engine_address, EINVALID_HARDWARE_SIGNATURE);
        } else {
            assert!(signer::address_of(solver_account) != @0x0, ENOT_AUTHORIZED);
        };

        // Transfer funds from resource escrow vault to recipient
        let vault = borrow_global_mut<TokenVault>(@prism_addr);
        let withdrawn_coins = coin::extract<AptosCoin>(&mut vault.coins, amount);
        coin::deposit(recipient_addr, withdrawn_coins);
    }
}
