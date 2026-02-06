export interface WalletData {
  publicKey: string;
  secretKey: Uint8Array;
  mnemonic: string;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
}