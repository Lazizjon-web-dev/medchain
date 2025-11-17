use crate::{
    constants::*,
    errors::MedChainError,
    events::{
        AccessGranted, DoctorInitialized, DoctorKeyUpdated, MedicalRecordAdded, PatientInitialized,
        RecordKeyRotated,
    },
    instructions::{
        AddMedicalRecord, GrantAccess, InitializeDoctor, InitializePatient, RotateRecordKey,
        UpdateDoctorKey,
    },
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

    pub fn initialize_doctor(
        ctx: Context<InitializeDoctor>,
        name: String,
        specialization: String,
        license_id: String,
    ) -> Result<()> {
        // Validate input lengths
        if name.len() > MAX_NAME_LENGTH {
            return err!(MedChainError::NameTooLong);
        }
        if specialization.len() > MAX_SPECIALIZATION_LENGTH {
            return err!(MedChainError::SpecializationTooLong);
        }
        if license_id.len() > MAX_LICENSE_ID_LENGTH {
            return err!(MedChainError::LicenseIdTooLong);
        }

        // Get the doctor account from context
        let doctor_account = &mut ctx.accounts.doctor_account;

        // Set the authority to the doctor who signed
        doctor_account.authority = *ctx.accounts.doctor.key;

        // Set the doctor's details
        doctor_account.name = name;
        doctor_account.specialization = specialization;
        doctor_account.license_id = license_id;

        // Initially, the doctor is unverified
        doctor_account.verified = false;

        // Set creation timestamp using Solana's clock
        doctor_account.created_at = Clock::get()?.unix_timestamp;

        // Store the PDA bump for future verification
        doctor_account.bump = ctx.bumps.doctor_account;

        // Emit an event for frontend tracking
        emit!(DoctorInitialized {
            doctor: doctor_account.key(),
            authority: doctor_account.authority,
            name: doctor_account.name.clone(),
            specialization: doctor_account.specialization.clone(),
            timestamp: doctor_account.created_at,
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

    pub fn grant_access(
        ctx: Context<GrantAccess>,
        doctor_wallet: Pubkey,
        duration_days: u64, // 0 = permanent access (use cautiously)
        encrypted_key_for_doctor: String,
    ) -> Result<()> {
        // Verify the medical record belongs to the patient
        if ctx.accounts.medical_record.patient != ctx.accounts.patient_account.key() {
            return err!(MedChainError::Unauthorized);
        }

        // Validate the encrypted key length
        if encrypted_key_for_doctor.len() > ENCRYPTED_KEY_LENGTH {
            return err!(MedChainError::EncryptedKeyTooLong);
        }

        let access_grant = &mut ctx.accounts.access_grant;
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Set up the access grant
        access_grant.record = ctx.accounts.medical_record.key();
        access_grant.doctor = doctor_wallet;
        access_grant.patient = ctx.accounts.patient_account.key();
        access_grant.granted_at = current_timestamp;
        access_grant.is_active = true;
        access_grant.encrypted_key = encrypted_key_for_doctor;
        access_grant.key_version = 1; // Start with version 1
        access_grant.bump = ctx.bumps.access_grant;

        // Calculate expiration timestamp
        if duration_days == 0 {
            // Permanent access (patient can still revoke)
            access_grant.expires_at = 0;
        } else {
            // Convert days to seconds and add to current time
            let duration_seconds = duration_days
                .checked_mul(24 * 60 * 60) // days * hours * minutes * seconds
                .ok_or(MedChainError::ArithmeticOverflow)?;

            access_grant.expires_at = current_timestamp
                .checked_add(duration_seconds as i64)
                .ok_or(MedChainError::ArithmeticOverflow)?;
        }

        // Emit event for frontend and audit trail
        emit!(AccessGranted {
            record: access_grant.record,
            doctor: access_grant.doctor,
            patient: access_grant.patient,
            granted_at: access_grant.granted_at,
            expires_at: access_grant.expires_at,
            key_version: access_grant.key_version,
        });

        Ok(())
    }

    pub fn rotate_record_key(
        ctx: Context<RotateRecordKey>,
        new_ipfs_hash: String,
        new_encrypted_key: String, // New symmetric key encrypted with patient's public key
    ) -> Result<()> {
        // Validate inputs
        if new_ipfs_hash.len() > IPFS_HASH_LENGTH {
            return err!(MedChainError::IpfsHashTooLong);
        }
        if new_encrypted_key.len() > ENCRYPTED_KEY_LENGTH {
            return err!(MedChainError::EncryptedKeyTooLong);
        }

        let medical_record = &mut ctx.accounts.medical_record;

        // Update the medical record with new IPFS hash and key
        medical_record.ipfs_hash = new_ipfs_hash;
        medical_record.encrypted_key = new_encrypted_key;
        medical_record.key_version = medical_record
            .key_version
            .checked_add(1)
            .ok_or(MedChainError::ArithmeticOverflow)?;

        emit!(RecordKeyRotated {
            record: medical_record.key(),
            patient: medical_record.patient,
            new_key_version: medical_record.key_version,
            rotated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_doctor_key(
        ctx: Context<UpdateDoctorKey>,
        doctor_wallet: Pubkey,
        new_encrypted_key_for_doctor: String, // New symmetric key encrypted with doctor's public key
    ) -> Result<()> {
        // Validate input
        if new_encrypted_key_for_doctor.len() > ENCRYPTED_KEY_LENGTH {
            return err!(MedChainError::EncryptedKeyTooLong);
        }

        let access_grant = &mut ctx.accounts.access_grant;
        let medical_record = &ctx.accounts.medical_record;

        // Verify the access grant is still active
        if !access_grant.is_active {
            return err!(MedChainError::AccessRevoked);
        }

        // Update the doctor's encrypted key and sync key version
        access_grant.encrypted_key = new_encrypted_key_for_doctor;
        access_grant.key_version = medical_record.key_version;

        emit!(DoctorKeyUpdated {
            record: medical_record.key(),
            doctor: doctor_wallet,
            patient: access_grant.patient,
            key_version: access_grant.key_version,
            updated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
