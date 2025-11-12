use crate::state::PatientAccount;
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