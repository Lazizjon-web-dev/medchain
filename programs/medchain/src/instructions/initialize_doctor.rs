use crate::{constants::*, error::MedChainError, events::DoctorInitialized, state::DoctorAccount};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeDoctor<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = DoctorAccount::LEN,
        seeds = [b"doctor", authority.key().as_ref()],
        bump
    )]
    pub doctor_account: Account<'info, DoctorAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeDoctor>,
    name: String,
    specialization: String,
    license_id: String,
) -> Result<()> {
    // Validate input lengths
    require!(name.len() <= MAX_NAME_LENGTH, MedChainError::NameTooLong);
    require!(
        specialization.len() <= MAX_SPECIALIZATION_LENGTH,
        MedChainError::SpecializationTooLong
    );
    require!(
        license_id.len() <= MAX_LICENSE_ID_LENGTH,
        MedChainError::LicenseIdTooLong
    );

    let doctor_account = &mut ctx.accounts.doctor_account;

    doctor_account.authority = *ctx.accounts.authority.key;
    doctor_account.name = name;
    doctor_account.specialization = specialization;
    doctor_account.license_id = license_id;
    doctor_account.verified = false; // Initially unverified
    doctor_account.created_at = Clock::get()?.unix_timestamp;
    doctor_account.bump = ctx.bumps.doctor_account;

    emit!(DoctorInitialized {
        doctor: doctor_account.key(),
        authority: doctor_account.authority,
        name: doctor_account.name.clone(),
        specialization: doctor_account.specialization.clone(),
        timestamp: doctor_account.created_at,
    });
    Ok(())
}
