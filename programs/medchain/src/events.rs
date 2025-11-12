use anchor_lang::prelude::*;

// Event for patient initialization
#[event]
pub struct PatientInitialized {
    pub patient: Pubkey,    // The PDA address of the patient account
    pub authority: Pubkey,  // The wallet that controls it
    pub timestamp: i64,     // When it was created
}

// Event for adding a medical record
#[event]
pub struct MedicalRecordAdded {
    pub patient: Pubkey,
    pub record: Pubkey,
    pub record_id: u64,
    pub record_type: String,
    pub timestamp: i64,
}