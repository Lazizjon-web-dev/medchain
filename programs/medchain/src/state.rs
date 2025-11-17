use crate::constants::{
    ENCRYPTED_KEY_LENGTH, IPFS_HASH_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_LICENSE_ID_LENGTH,
    MAX_NAME_LENGTH, MAX_RECORD_TYPE_LENGTH, MAX_SPECIALIZATION_LENGTH,
};
use anchor_lang::prelude::*;

#[account]
pub struct AccessGrant {
    pub record: Pubkey,
    pub patient: Pubkey,
    pub doctor: Pubkey,
    pub encrypted_key: String, // Encrypted with public key of the doctor
    pub key_version: u64,
    pub granted_at: i64,
    pub expires_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl AccessGrant {
    pub const LEN: usize = 8 + // Discriminator
    32 + // record (Pubkey)
    32 + // patient (Pubkey)
    32 + // doctor (Pubkey)
    (4 + ENCRYPTED_KEY_LENGTH) + // encrypted_key (String prefix + content)
    8 + // key_version (u64)
    8 + // granted_at (i64)
    8 + // expires_at (i64)
    1 + // is_active (bool)
    1; // bump (u8)
}

#[account]
pub struct DoctorAccount {
    pub authority: Pubkey,
    pub name: String,
    pub specialization: String,
    pub license_id: String,
    pub verified: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl DoctorAccount {
    pub const LEN: usize = 8 + // Discriminator
    32 + // authority (Pubkey)
    (4 + MAX_NAME_LENGTH) + // name (String prefix + content)
    (4 + MAX_SPECIALIZATION_LENGTH) + // specialization (String prefix + content)
    (4 + MAX_LICENSE_ID_LENGTH) + // license_id (String prefix + content)
    1 + // verified (bool)
    8 + // created_at (i64)
    1; // bump (u8)
}

#[account]
pub struct MedicalRecord {
    pub patient: Pubkey,
    pub record_id: u64,
    pub ipfs_hash: String,
    pub record_type: String,
    pub description: String,
    pub created_at: i64,
    pub encrypted_key: String,
    pub key_version: u64,
    pub bump: u8,
}

impl MedicalRecord {
    pub const LEN: usize = 8 + // Discriminator
    32 + // patient (Pubkey)
    8 + // record_id (u64)
    (4 + IPFS_HASH_LENGTH) + // ipfs_hash (String prefix + content)
    (4 + MAX_RECORD_TYPE_LENGTH) + // record_type (String prefix + content)
    (4 + MAX_DESCRIPTION_LENGTH) + // description (String prefix + content)
    8 + // created_at (i64)
    (4 + ENCRYPTED_KEY_LENGTH) + // encrypted_key (String prefix + content)
    8 + // key_version (u64)
    1; // bump (u8)
}

#[account]
pub struct PatientAccount {
    pub authority: Pubkey,
    pub name: String,
    pub record_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl PatientAccount {
    pub const LEN: usize = 8 + // Discriminator
    32 + // authority (Pubkey)
    (4 + MAX_NAME_LENGTH) + // name (String prefix + content)
    8 + // record_count (u64)
    8 + // created_at (i64)
    1; // bump (u8)
}
