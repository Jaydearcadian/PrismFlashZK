module prism_addr::prism_pusd {
    /// Phantom CoinType marker for the Prism USD spoke representation on Movement.
    /// Holds no fields/logic itself - it exists only so
    /// `0x1::managed_coin::initialize<PrismPUSD>(...)` and `Coin<PrismPUSD>` have a
    /// concrete type to hang off, per the standard Aptos-Move coin-issuance pattern
    /// (see scripts/create_multivm_token.js for the initialize/mint call sequence).
    struct PrismPUSD {}
}
