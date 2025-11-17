use crate::{
    errors::MedChainError,
    state::{AccessGrant, DoctorAccount, MedicalRecord, PatientAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializePatient<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(init,
        payer = user, space = PatientAccount::LEN, seeds = [b"patient", user.key().as_ref()], bump)]
    pub patient: Account<'info, PatientAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeDoctor<'info> {
    #[account(mut)]
    pub doctor: Signer<'info>,

    #[account(
        init_if_needed,
        payer = doctor,
        space = DoctorAccount::LEN,
        seeds = [b"doctor", doctor.key().as_ref()],
        bump
    )]
    pub doctor_account: Account<'info, DoctorAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyDoctor<'info> {
    #[account(mut)]A
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"doctor", doctor_account.authority.as_ref()],
        bump = doctor_account.bump,
        constraint = doctor_account.is_verified == false @ MedChainError::AlreadyVerified,
    )]
    pub doctor_account: Account<'info, DoctorAccount>,
}

#[derive(Accounts)]
#[instruction(record_id: u64)]
pub struct AddMedicalRecord<'info> {
    #[account(mut)]
    pub patient: Signer<'info>,

    #[account(mut, has_one = authority, seeds = [b"patient", patient.key().as_ref()], bump = patient_account.bump,)]
    pub patient_account: Account<'info, PatientAccount>,

    #[account(
        init,
        payer = patient,
        space = MedicalRecord::LEN,
        seeds = [b"medical_record",
        patient.key().as_ref(),
        &record_id.to_le_bytes()],
        bump
    )]
    pub medical_record: Account<'info, MedicalRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(doctor_wallet: Pubkey)]
pub struct GrantAccess<'info> {
    #[account(mut)]
    pub patient: Signer<'info>,

    #[account(
        has_one = authority,
        seeds = [b"patient", patient.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    // Medical Record to which access is being granted - must belong to the patient
    pub medical_record: Account<'info, MedicalRecord>,

    // The AccessGrant PDA to be created
    #[account(
        init,
        payer = patient,
        space = AccessGrant::LEN,
        seeds = [b"access_grant", medical_record.key().as_ref(), doctor_wallet.as_ref()],
        bump
    )]
    pub access_grant: Account<'info, AccessGrant>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RotateRecordKey<'info> {
    #[account(mut)]
    pub patient: Signer<'info>,

    #[account(
        has_one = authority,
        seeds = [b"patient", patient.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    #[account(mut, has_one = patient)]
    pub medical_record: Account<'info, MedicalRecord>,

    pub system_program: Program<'info, System>,
}

// Context for updating a specific doctor's key
#[derive(Accounts)]
#[instruction(doctor_wallet: Pubkey)]
pub struct UpdateDoctorKey<'info> {
    #[account(mut)]
    pub patient: Signer<'info>,

    #[account(
        has_one = authority,
        seeds = [b"patient", patient.key().as_ref()],
        bump = patient_account.bump,
    )]
    pub patient_account: Account<'info, PatientAccount>,

    pub medical_record: Account<'info, MedicalRecord>,

    #[account(
        mut,
        seeds = [b"access_grant", medical_record.key().as_ref(), doctor_wallet.as_ref()],
        bump = access_grant.bump,
        constraint = access_grant.patient == patient_account.key() @ MedChainError::Unauthorized,
    )]
    pub access_grant: Account<'info, AccessGrant>,
}
