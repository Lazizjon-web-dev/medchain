use crate::{
    constants::*, errors::MedChainError, events::PatientInitialized,
    instructions::InitializePatient,
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
}

#[derive(Accounts)]
pub struct Initialize {}
