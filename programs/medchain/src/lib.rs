pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("3AARAocLgUP4UR6hYFHZSRwhvUfh4scd1t1ENYDEQTWs");

#[program]
pub mod medchain {
    use super::*;

    pub fn initialize_patient(ctx: Context<InitializePatient>, name: String) -> Result<()> {
        instructions::initialize_patient::handler(ctx, name)
    }

    pub fn initialize_doctor(
        ctx: Context<InitializeDoctor>,
        name: String,
        specialization: String,
        license_id: String,
    ) -> Result<()> {
        instructions::initialize_doctor::handler(ctx, name, specialization, license_id)
    }

    pub fn add_medical_record(
        ctx: Context<AddMedicalRecord>,
        record_id: u64,
        record_type: String,
        description: String,
        ipfs_hash: String,
        encrypted_key: String,
    ) -> Result<()> {
        instructions::add_medical_record::handler(
            ctx,
            record_id,
            record_type,
            description,
            ipfs_hash,
            encrypted_key,
        )
    }

    pub fn grant_access(
        ctx: Context<GrantAccess>,
        doctor: Pubkey,
        duration_days: u64,
        encrypted_key_for_doctor: String,
    ) -> Result<()> {
        instructions::grant_access::handler(ctx, doctor, duration_days, encrypted_key_for_doctor)
    }
}
