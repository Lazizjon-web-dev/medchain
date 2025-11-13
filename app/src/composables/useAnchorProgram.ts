import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Medchain } from "../../../target/types/medchain";
export function useAnchorProgram() {
    const program = anchor.workspace.medchain as Program<Medchain>;
    return { program };
}