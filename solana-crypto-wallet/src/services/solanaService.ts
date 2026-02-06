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
    return {
      mint: info.mint,
      symbol: info.mint.slice(0, 4) + '...', 
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
  const pubKey = new PublicKey(publicKey);
  
  const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
  
  const transactions: TransactionRecord[] = [];
  
  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx?.meta) continue;

      const accountKeys = tx.transaction.message.accountKeys;
      const ourIndex = accountKeys.findIndex(
        (key) => key.pubkey.toBase58() === publicKey
      );
      
      const preBalance = tx.meta.preBalances[ourIndex];
      const postBalance = tx.meta.postBalances[ourIndex];
      const diff = (postBalance - preBalance) / LAMPORTS_PER_SOL;
      

      const isSent = diff < 0;

      const otherIndex = isSent ? 1 : 0;
      const otherParty = accountKeys[otherIndex]?.pubkey.toBase58() || 'Unknown';
      
      transactions.push({
        signature: sig.signature,
        timestamp: sig.blockTime ?? null,
        type: isSent ? 'sent' : 'received',
        amount: Math.abs(diff),
        otherParty: otherParty,
        status: tx.meta.err ? 'failed' : 'success',
      });
    } catch (e) {
      console.error('Error parsing transaction:', e);
    }
  }
  
  return transactions;
};