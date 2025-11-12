use anchor_lang::prelude::*;

#[error_code]
pub enum MedChainError {
    #[msg("Patient name too long")]
    NameTooLong,
    #[msg("Record type too long")]
    RecordTypeTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("IPFS hash too long")]
    IpfsHashTooLong,
    #[msg("Encrypted key too long")]
    EncryptedKeyTooLong,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Access grant expired")]
    AccessExpired,
    #[msg("Access grant revoked")]
    AccessRevoked,
    #[msg("Invalid record ID")]
    InvalidRecordId,
}
