use crate::{
    constants::*,
    error::MedChainError,
    events::DoctorKeyUpdated,
    state::{AccessGrant, MedicalRecord, PatientAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(doctor_account: Pubkey)]
pub struct UpdateDoctorKey<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        has_one = authority @ MedChainError::Unauthorized,
        seeds = [b"patient", authority.key().as_ref()],
        bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    pub medical_record: Account<'info, MedicalRecord>,

    #[account(
        mut,
        has_one = authority @ MedChainError::Unauthorized,
        seeds = [b"grant_access", medical_record.key().as_ref(), doctor_account.key().as_ref()],
        bump = access_grant.bump,
    )]
    pub access_grant: Account<'info, AccessGrant>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpdateDoctorKey>,
    doctor_account: Pubkey,
    new_encrypted_key_for_doctor: String,
) -> Result<()> {
    // Validate input lengths
    require!(
        new_encrypted_key_for_doctor.len() <= ENCRYPTED_KEY_LENGTH,
        MedChainError::EncryptedKeyTooLong
    );

    let access_grant = &mut ctx.accounts.access_grant;
    let medical_record = &ctx.accounts.medical_record;

    //TODO: Add additional check whether access is already revoked

    access_grant.encrypted_key = new_encrypted_key_for_doctor;
    access_grant.key_version = medical_record.key_version;

    emit!(DoctorKeyUpdated {
        record: medical_record.key(),
        doctor: doctor_account,
        patient: access_grant.authority,
        key_version: access_grant.key_version,
        updated_at: Clock::get()?.unix_timestamp
    });

    Ok(())
}
