use anchor_lang::prelude::*;

// Event for patient initialization
#[event]
pub struct PatientInitialized {
    pub patient: Pubkey,    // The PDA address of the patient account
    pub authority: Pubkey,  // The wallet that controls it
    pub timestamp: i64,     // When it was created
}