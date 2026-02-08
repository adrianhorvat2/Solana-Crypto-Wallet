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

export interface TransactionRecord {
  signature: string;
  timestamp: number | null;
  type: 'sent' | 'received';
  amount: number;
  otherParty: string;
  status: 'success' | 'failed';
  tokenSymbol: string;
}