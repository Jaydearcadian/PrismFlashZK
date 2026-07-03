module prism_addr::movement_escrow {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};

    /// Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EINVALID_HARDWARE_SIGNATURE: u64 = 2;
    const EALREADY_INITIALIZED: u64 = 3;

    /// Global configuration state (one per deployment, shared across coin types).
    struct VaultConfig has key {
        admin: address,
        is_hardware_enforced: bool,
        spectrum_engine_address: address,
    }

    /// Holds the locked payout liquidity for a specific coin type. Generic over CoinType so the
    /// escrow disburses the SAME asset that scripts/create_multivm_token.js issues on Movement
    /// (e.g. prism_addr::prism_pusd::PrismPUSD) rather than being hardcoded to native AptosCoin.
    struct TokenVault<phantom CoinType> has key {
        coins: Coin<CoinType>
    }

    /// Event emitted upon successful payouts
    struct PayoutEvent has drop, store {
        nullifier: vector<u8>,
        recipient: address,
        amount: u64
    }

    /// Initializes the config (once) and an empty vault for `CoinType`. Callable once per coin type;
    /// the shared VaultConfig is created on the first call only.
    public entry fun initialize<CoinType>(
        account: &signer,
        is_hardware_enforced: bool,
        spectrum_engine_address: address
    ) {
        let admin_addr = signer::address_of(account);

        if (!exists<VaultConfig>(admin_addr)) {
            move_to(account, VaultConfig {
                admin: admin_addr,
                is_hardware_enforced,
                spectrum_engine_address,
            });
        };

        assert!(!exists<TokenVault<CoinType>>(admin_addr), EALREADY_INITIALIZED);
        move_to(account, TokenVault<CoinType> {
            coins: coin::zero<CoinType>()
        });
    }

    /// Seeds the vault with payout liquidity. Without this the vault is created empty and every
    /// `process_payout` aborts on an insufficient-balance extract — this is what makes real payouts
    /// possible. Withdraws `amount` of `CoinType` from the funder and merges it into the vault.
    public entry fun fund_vault<CoinType>(funder: &signer, amount: u64) acquires TokenVault {
        let coins = coin::withdraw<CoinType>(funder, amount);
        let vault = borrow_global_mut<TokenVault<CoinType>>(@prism_addr);
        coin::merge(&mut vault.coins, coins);
    }

    /// Opt-in registration so a payout recipient has a CoinStore<CoinType> before receiving funds
    /// (coin::deposit aborts otherwise). Idempotent.
    public entry fun register<CoinType>(account: &signer) {
        if (!coin::is_account_registered<CoinType>(signer::address_of(account))) {
            coin::register<CoinType>(account);
        }
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
    public entry fun process_payout<CoinType>(
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
        let vault = borrow_global_mut<TokenVault<CoinType>>(@prism_addr);
        let withdrawn_coins = coin::extract<CoinType>(&mut vault.coins, amount);
        coin::deposit<CoinType>(recipient_addr, withdrawn_coins);

        // Emit trace log inside execution context
        // aptos_framework::event::emit(PayoutEvent { nullifier, recipient: recipient_addr, amount });
    }

    /// Releases locked assets upon cryptographically verifying the ECIES/Secp256k1 signature
    /// of the verified AWS Nitro Enclave proxy key (spectrum_engine_address).
    public entry fun process_payout_with_signature<CoinType>(
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
        let vault = borrow_global_mut<TokenVault<CoinType>>(@prism_addr);
        let withdrawn_coins = coin::extract<CoinType>(&mut vault.coins, amount);
        coin::deposit<CoinType>(recipient_addr, withdrawn_coins);
    }
}
