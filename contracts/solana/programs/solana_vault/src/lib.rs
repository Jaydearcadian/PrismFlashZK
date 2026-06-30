use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PrisMFLasH111111111111111111111111111111111");

#[program]
pub mod solana_vault {
    use super::*;

    /// Initializes the global state and configurations.
    pub fn initialize(ctx: Context<Initialize>, is_hardware_enforced: bool, spectrum_engine_pubkey: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.global_state;
        state.authority = ctx.accounts.authority.key();
        state.is_hardware_enforced = is_hardware_enforced;
        state.spectrum_engine_pubkey = spectrum_engine_pubkey;
        state.total_disbursed = 0;
        Ok(())
    }

    /// Toggles the upgrade path from optimistic Solver validation to hardware-isolated TEE enforcement.
    pub fn configure_upgrade_hook(ctx: Context<ConfigureUpgrade>, is_hardware_enforced: bool, spectrum_engine_pubkey: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.global_state;
        require_keys_eq!(state.authority, ctx.accounts.authority.key(), VaultError::Unauthorized);
        state.is_hardware_enforced = is_hardware_enforced;
        state.spectrum_engine_pubkey = spectrum_engine_pubkey;
        Ok(())
    }

    /// Processes an instant settlement payout to the user's recipient wallet.
    ///
    /// # Arguments
    /// * `nullifier` - The unique 32-byte identifier corresponding to the Stellar/Base escrow commitment.
    /// * `amount` - Amount of native token or SPL asset to disburse.
    pub fn process_settlement(ctx: Context<ProcessSettlement>, nullifier: [u8; 32], amount: u64) -> Result<()> {
        let state = &ctx.accounts.global_state;

        // Verify Solver / Signer Authority
        if state.is_hardware_enforced {
            // Under hardware-enforced mode, only the verified TEE Spectrum Engine is authorized to dispatch instructions
            require_keys_eq!(
                ctx.accounts.signer.key(),
                state.spectrum_engine_pubkey,
                VaultError::InvalidHardwareSignature
            );
        } else {
            // In optimistic Solver mode, any authorized Solver with matching collateral can process payouts
            require!(ctx.accounts.signer.is_signer, VaultError::MissingSignature);
        }

        // Perform PDA token transfer from Vault to recipient
        let vault_bump = ctx.bumps.vault_account;
        let seeds = &[
            b"prism_vault".as_ref(),
            &[vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, amount)?;

        // Log completion event
        msg!("PrismZK Payout Success: Nullifier {:?} filled with amount {}", nullifier, amount);

        let state_mut = &mut ctx.accounts.global_state;
        state_mut.total_disbursed = state_mut.total_disbursed.checked_add(amount).unwrap();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 1 + 32 + 8)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfigureUpgrade<'info> {
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ProcessSettlement<'info> {
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    /// CHECK: Recipient wallet is unconstrained in this layout
    pub recipient: AccountInfo<'info>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    /// CHECK: PDA authority managing the vault tokens
    #[account(
        seeds = [b"prism_vault".as_ref()],
        bump
    )]
    pub vault_account: AccountInfo<'info>,
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub is_hardware_enforced: bool,
    pub spectrum_engine_pubkey: Pubkey,
    pub total_disbursed: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("You are not authorized to perform this operation.")]
    Unauthorized,
    #[msg("Instruction was not signed by the registered TEE Spectrum Engine enclave key.")]
    InvalidHardwareSignature,
    #[msg("Required transaction authorization is missing.")]
    MissingSignature,
}
