use crate::{
    constants::MAX_NAME_LENGTH, error::MedChainError, events::PatientInitialized,
    state::PatientAccount,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializePatient<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = PatientAccount::LEN,
        seeds = [b"patient", user.key().as_ref()],
        bump
    )]
    pub patient_account: Account<'info, PatientAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePatient>, name: String) -> Result<()> {
    // Validate input length
    require!(name.len() <= MAX_NAME_LENGTH, MedChainError::NameTooLong);

    //
    let patient = &mut ctx.accounts.patient_account;
    patient.authority = *ctx.accounts.user.key;
    patient.name = name;
    patient.record_count = 0;
    patient.created_at = Clock::get()?.unix_timestamp;
    patient.bump = ctx.bumps.patient_account;

    // Emit an event for frontend tracking
    emit!(PatientInitialized {
        patient: patient.key(),
        authority: patient.authority,
        timestamp: patient.created_at,
    });

    Ok(())
}
