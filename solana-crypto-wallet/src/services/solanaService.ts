import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { TokenBalance, TransactionRecord } from '../types/wallet';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const connection = new Connection(RPC_URL, 'confirmed');

const KNOWN_TOKENS: Record<string, string> = {
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC',
  'So11111111111111111111111111111111111111112': 'wSOL',
};

// SOL balance
export const getBalance = async (publicKey: string): Promise<number> => {
  const pubKey = new PublicKey(publicKey);
  const balance = await connection.getBalance(pubKey);
  return balance / LAMPORTS_PER_SOL;
};

// SPL token balances
export const getTokenBalances = async (publicKey: string): Promise<TokenBalance[]> => {
  const pubKey = new PublicKey(publicKey);
  
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
    programId: TOKEN_PROGRAM_ID,
  });
  
  return tokenAccounts.value.map((account) => {
    const info = account.account.data.parsed.info;
    const mint = info.mint;
    return {
      mint: info.mint,
      symbol: KNOWN_TOKENS[mint] || mint.slice(0, 4) + '...', 
      balance: info.tokenAmount.uiAmount || 0,
      decimals: info.tokenAmount.decimals,
    };
  });
};

export const sendSol = async (
  fromKeypair: Keypair,
  toAddress: string,
  amount: number
): Promise<string> => {
  const toPubKey = new PublicKey(toAddress);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPubKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  
  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  
  return signature;
};

export const getTransactionHistory = async (publicKey: string): Promise<TransactionRecord[]> => {

    const response = await fetch(
    `https://api-devnet.helius.xyz/v0/addresses/${publicKey}/transactions?api-key=${HELIUS_API_KEY}`
  );
  
  const txs = await response.json();
  const transactions: TransactionRecord[] = [];
  
  for (const tx of txs.slice(0, 10)) {
    const nativeTransfers = tx.nativeTransfers || [];
    const tokenTransfers = tx.tokenTransfers || [];
    
    for (const transfer of nativeTransfers) {
      const isSent = transfer.fromUserAccount === publicKey;
      const amount = transfer.amount / LAMPORTS_PER_SOL;
      
      if (Math.abs(amount) < 0.00001) continue;
      
      transactions.push({
        signature: tx.signature,
        timestamp: tx.timestamp,
        type: isSent ? 'sent' : 'received',
        amount: Math.abs(amount),
        otherParty: isSent ? transfer.toUserAccount : transfer.fromUserAccount,
        status: 'success',
        tokenSymbol: 'SOL',
      });
    }
    
    for (const transfer of tokenTransfers) {
      const isSent = transfer.fromUserAccount === publicKey;
      const mint = transfer.mint;
      const symbol = KNOWN_TOKENS[mint] || mint.slice(0, 4) + '...';
      
      transactions.push({
        signature: tx.signature,
        timestamp: tx.timestamp,
        type: isSent ? 'sent' : 'received',
        amount: transfer.tokenAmount,
        otherParty: isSent ? transfer.toUserAccount : transfer.fromUserAccount,
        status: 'success',
        tokenSymbol: symbol,
      });
    }
  }
  
  return transactions;
};