import { Keypair } from '@stellar/stellar-sdk';
import { deriveSep0005Seed } from './hd-seed';

export function deriveStellarKeypair(mnemonic: string, index: number): Keypair {
  return Keypair.fromRawEd25519Seed(deriveSep0005Seed(mnemonic, index));
}

export function deriveAccountKeypairs(mnemonic: string, count: number): Keypair[] {
  return Array.from({ length: count }, (_, index) => deriveStellarKeypair(mnemonic, index));
}
