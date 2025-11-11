use anchor_lang::prelude::*;

declare_id!("AYG9C7oh9YMBB5h7bpVztujm6WmYwwi8EsDfqe1GPHLB");

#[program]
pub mod medchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
