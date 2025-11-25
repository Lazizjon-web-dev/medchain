use crate::{
    constants::*,
    error::MedChainError,
    events::MedicalRecordAdded,
    state::{MedicalRecord, PatientAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddMedicalRecord<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        seeds = [b"patient", authority.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    #[account(
        init,
        payer = authority,
        space = MedicalRecord::LEN,
        seeds = [b"record", authority.key().as_ref(), &patient_account.record_count.to_le_bytes()],
        bump
    )]
    pub medical_record: Account<'info, MedicalRecord>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddMedicalRecord>,
    record_id: u64,
    record_type: String,
    description: String,
    ipfs_hash: String,
    encrypted_key: String,
) -> Result<()> {
    // Validate input lengths
    require!(
        record_type.len() <= MAX_RECORD_TYPE_LENGTH,
        MedChainError::RecordTypeTooLong
    );
    require!(
        description.len() <= MAX_DESCRIPTION_LENGTH,
        MedChainError::DescriptionTooLong
    );
    require!(
        ipfs_hash.len() <= IPFS_HASH_LENGTH,
        MedChainError::IpfsHashTooLong
    );
    require!(
        encrypted_key.len() <= ENCRYPTED_KEY_LENGTH,
        MedChainError::EncryptedKeyTooLong
    );

    // Verify that the record_id matches the patient's current records_count
    let patient_account = &mut ctx.accounts.patient_account;
    if record_id != patient_account.record_count {
        return err!(MedChainError::InvalidRecordId);
    }

    // Update patient account's record count
    patient_account.record_count = patient_account.record_count.checked_add(1).unwrap();

    // Populate the medical record account
    let medical_record = &mut ctx.accounts.medical_record;
    medical_record.patient = patient_account.key();
    medical_record.record_id = record_id;
    medical_record.ipfs_hash = ipfs_hash;
    medical_record.record_type = record_type;
    medical_record.description = description;
    medical_record.created_at = Clock::get()?.unix_timestamp;
    medical_record.encrypted_key = encrypted_key;
    medical_record.bump = ctx.bumps.medical_record;

    // Emit an event
    emit!(MedicalRecordAdded {
        patient: patient_account.key(),
        record: medical_record.key(),
        record_id,
        record_type: medical_record.record_type.clone(),
        timestamp: medical_record.created_at,
    });

    Ok(())
}
