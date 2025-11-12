use crate::{
    constants::*,
    errors::MedChainError,
    events::{MedicalRecordAdded, PatientInitialized},
    instructions::{AddMedicalRecord, InitializePatient},
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

mod constants;
mod errors;
mod events;
mod instructions;
mod state;

declare_id!("AYG9C7oh9YMBB5h7bpVztujm6WmYwwi8EsDfqe1GPHLB");

#[program]
pub mod medchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
    // Initialize a patient account
    pub fn initialize_patient(ctx: Context<InitializePatient>, name: String) -> Result<()> {
        // Validate input length
        if name.len() > MAX_NAME_LENGTH {
            return err!(MedChainError::NameTooLong);
        }

        // Get the patient account from context
        let patient = &mut ctx.accounts.patient;

        // Set the authority to the user who signed
        patient.authority = *ctx.accounts.user.key;

        // Set the patient's name
        patient.name = name;

        // Initialize records count to 0
        patient.record_count = 0;

        // Set creation timestamp using Solana's clock
        patient.created_at = Clock::get()?.unix_timestamp;

        // Store the PDA bump for future verification
        patient.bump = ctx.bumps.patient;

        // Emit an event for frontend tracking
        emit!(PatientInitialized {
            patient: patient.key(),
            authority: patient.authority,
            timestamp: patient.created_at,
        });

        Ok(())
    }

    pub fn add_medical_record(
        ctx: Context<AddMedicalRecord>,
        record_id: u64,
        ipfs_hash: String,
        record_type: String,
        description: String,
        encrypted_key: String,
    ) -> Result<()> {
        // Validate input lengths
        if ipfs_hash.len() > IPFS_HASH_LENGTH {
            return err!(MedChainError::IpfsHashTooLong);
        }
        if record_type.len() > MAX_RECORD_TYPE_LENGTH {
            return err!(MedChainError::RecordTypeTooLong);
        }
        if description.len() > MAX_DESCRIPTION_LENGTH {
            return err!(MedChainError::DescriptionTooLong);
        }
        if encrypted_key.len() > ENCRYPTED_KEY_LENGTH {
            return err!(MedChainError::EncryptedKeyTooLong);
        }

        // Verify that the record_id matches the patient's current records_count
        let patient_account = &mut ctx.accounts.patient_account;
        if record_id != patient_account.record_count {
            return err!(MedChainError::InvalidRecordId);
        }

        // Update the patient's record count
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
}

#[derive(Accounts)]
pub struct Initialize {}
