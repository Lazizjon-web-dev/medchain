use crate::{
    constants::*,
    error::MedChainError,
    events::RecordKeyRotated,
    state::{MedicalRecord, PatientAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RotateRecordKey<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ MedChainError::Unauthorized,
        seeds = [b"patient", authority.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    #[account(
        mut,
        has_one = authority @ MedChainError::Unauthorized,
        seeds = [b"medical_record", authority.key().as_ref(), &medical_record.record_id.to_le_bytes()],
        bump = medical_record.bump,
    )]
    pub medical_record: Account<'info, MedicalRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RotateRecordKey>,
    new_ipfs_hash: String,
    new_encrypted_key: String,
) -> Result<()> {
    // Validate input lengths
    require!(
        new_ipfs_hash.len() <= IPFS_HASH_LENGTH,
        MedChainError::IpfsHashTooLong
    );
    require!(
        new_encrypted_key.len() <= ENCRYPTED_KEY_LENGTH,
        MedChainError::EncryptedKeyTooLong
    );

    let medical_record = &mut ctx.accounts.medical_record;

    medical_record.ipfs_hash = new_ipfs_hash;
    medical_record.encrypted_key = new_encrypted_key;
    medical_record.key_version = medical_record
        .key_version
        .checked_add(1)
        .ok_or(MedChainError::ArithmeticOverflow)?;

    emit!(RecordKeyRotated {
        record: medical_record.key(),
        authority: ctx.accounts.authority.key(),
        new_key_version: medical_record.key_version,
        rotated_at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
