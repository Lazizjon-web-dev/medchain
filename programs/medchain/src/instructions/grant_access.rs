use crate::{
    constants::*,
    error::MedChainError,
    state::{AccessGrant, MedicalRecord, PatientAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(doctor: Pubkey)]
pub struct GrantAccess<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        has_one = authority,
        seeds = [b"patient", authority.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    pub medical_record: Account<'info, MedicalRecord>,

    #[account(
        init,
        payer = authority,
        space = AccessGrant::LEN,
        seeds = [b"access_grant", medical_record.key().as_ref(), doctor.as_ref()],
        bump
    )]
    pub access_grant: Account<'info, AccessGrant>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<GrantAccess>,
    doctor: Pubkey,
    duration_days: u64,
    encrypted_key_for_doctor: String,
) -> Result<()> {
    // Verify that the medical record belongs to the patient
    require!(
        ctx.accounts.medical_record.patient == ctx.accounts.patient_account.key(),
        MedChainError::Unauthorized
    );
    // Validate input length
    require!(
        encrypted_key_for_doctor.len() <= ENCRYPTED_KEY_LENGTH,
        MedChainError::EncryptedKeyTooLong
    );

    let access_grant = &mut ctx.accounts.access_grant;
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    // Setup access grant details
    access_grant.record = ctx.accounts.medical_record.key();
    access_grant.patient = ctx.accounts.patient_account.key();
    access_grant.doctor = doctor;
    access_grant.encrypted_key = encrypted_key_for_doctor;
    access_grant.key_version = 1; // Initial version
    access_grant.granted_at = current_timestamp;
    access_grant.expires_at = match duration_days {
        0 => i64::MAX, // No expiration
        _ => current_timestamp
            .checked_add(
                duration_days
                    .checked_mul(24 * 60 * 60)
                    .ok_or(MedChainError::ArithmeticOverflow)? as i64,
            )
            .ok_or(MedChainError::ArithmeticOverflow)?,
    };

    Ok(())
}
