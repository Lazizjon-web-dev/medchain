import { useWallet } from './useWallet'
import { useAnchorProgram } from './useAnchorProgram'
export function useKeyManagement() {
  const { publicKey } = useWallet()
  const { program } = useAnchorProgram()
}
