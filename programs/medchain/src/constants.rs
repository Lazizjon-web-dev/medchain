use anchor_lang::prelude::*;

pub const MAX_NAME_LENGTH: usize = 50;
pub const MAX_RECORD_TYPE_LENGTH: usize = 20;
pub const MAX_DESCRIPTION_LENGTH: usize = 200;
pub const IPFS_HASH_LENGTH: usize = 46;
pub const ENCRYPTED_KEY_LENGTH: usize = 128;
pub const MAX_SPECIALIZATION_LENGTH: usize = 50;
pub const MAX_LICENSE_ID_LENGTH: usize = 30;

#[constant]
pub const DOCTOR_SEED: &[u8] = b"doctor";
#[constant]
pub const MEDICAL_RECORD_SEED: &[u8] = b"record";
#[constant]
pub const PATIENT_ACCOUNT_SEED: &[u8] = b"patient_account";
