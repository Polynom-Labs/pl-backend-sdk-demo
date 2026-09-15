import { deriveSep0005Seed } from './hd-seed';

const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('SEP-0005 HD derivation', () => {
  it('is deterministic', () => {
    const first = deriveSep0005Seed(MNEMONIC, 0);
    const second = deriveSep0005Seed(MNEMONIC, 0);
    expect(first.equals(second)).toBe(true);
    expect(first.length).toBe(32);
  });

  it('derives distinct accounts', () => {
    const a = deriveSep0005Seed(MNEMONIC, 0);
    const b = deriveSep0005Seed(MNEMONIC, 1);
    expect(a.equals(b)).toBe(false);
  });
});
