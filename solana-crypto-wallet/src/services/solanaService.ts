import { 
    Connection, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
    Transaction, 
    SystemProgram, 
    sendAndConfirmTransaction, 
    Keypair 
} from '@solana/web3.js';
import { 
    getOrCreateAssociatedTokenAccount, 
    createTransferInstruction, 
    getMint,
    getAssociatedTokenAddress
} from '@solana/spl-token';
import type { TokenBalance, TransactionRecord } from '../types/wallet';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const connection = new Connection(RPC_URL, 'confirmed');

const KNOWN_TOKENS: Record<string, string> = {
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC',
  'So11111111111111111111111111111111111111112': 'wSOL',
};

export const getBalance = async (publicKey: string): Promise<number> => {
  const pubKey = new PublicKey(publicKey);
  const balance = await connection.getBalance(pubKey);
  return balance / LAMPORTS_PER_SOL;
};

export const getTokenBalances = async (publicKey: string): Promise<TokenBalance[]> => {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `my-id-${Date.now()}`,
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: publicKey,
          page: 1,
          limit: 100,
          displayOptions: {
            showNativeBalance: false, 
            showFungible: true
          },
        },
      }),
    });

    const { result } = await response.json();
    const items = result?.items || [];

    return items.map((asset: any) => {
      if (!asset.token_info) return null;
      const mint = asset.id;
      const symbol = KNOWN_TOKENS[mint] || asset.content?.metadata?.symbol || mint.slice(0, 4) + '...';

      return {
        mint: mint,
        symbol: symbol,
        balance: asset.token_info.balance / Math.pow(10, asset.token_info.decimals),
        decimals: asset.token_info.decimals,
      };
    }).filter((item: TokenBalance | null): item is TokenBalance => item !== null);

  } catch (e) {
    console.error("Greška pri dohvatu tokena:", e);
    return [];
  }
};

export const sendSol = async (fromKeypair: Keypair, toAddress: string, amount: number): Promise<string> => {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  return await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
};

export const sendToken = async (fromKeypair: Keypair, toAddress: string, amount: number, mintAddress: string): Promise<string> => {
  const mintPubKey = new PublicKey(mintAddress);
  const toPubKey = new PublicKey(toAddress);

  const fromAta = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, mintPubKey, fromKeypair.publicKey);
  const toAta = await getOrCreateAssociatedTokenAccount(connection, fromKeypair, mintPubKey, toPubKey);
  const mintInfo = await getMint(connection, mintPubKey);
  
  const transaction = new Transaction().add(
    createTransferInstruction(fromAta.address, toAta.address, fromKeypair.publicKey, amount * Math.pow(10, mintInfo.decimals))
  );

  return await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
};

export const getTransactionHistory = async (publicKey: string): Promise<TransactionRecord[]> => {
  try {
    const pubKeyObj = new PublicKey(publicKey);
    
    // ATA USDC adress
    const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    const usdcAta = await getAssociatedTokenAddress(usdcMint, pubKeyObj);

    const urls = [
      `https://api-devnet.helius.xyz/v0/addresses/${publicKey}/transactions?api-key=${HELIUS_API_KEY}&t=${Date.now()}`,
      `https://api-devnet.helius.xyz/v0/addresses/${usdcAta.toString()}/transactions?api-key=${HELIUS_API_KEY}&t=${Date.now()}`
    ];

    const responses = await Promise.all(urls.map(url => 
        fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' })
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
    ));

    // Join transactions
    const txs = [...responses[0], ...responses[1]];
    const transactions: TransactionRecord[] = [];
    
    for (const tx of txs) {
      // SPL
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        for (const transfer of tx.tokenTransfers) {
          const isSent = transfer.fromUserAccount === publicKey;
          
          transactions.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            type: isSent ? 'sent' : 'received',
            amount: transfer.tokenAmount,
            otherParty: isSent ? (transfer.toUserAccount || "Unknown") : (transfer.fromUserAccount || "Unknown"),
            status: 'success',
            tokenSymbol: KNOWN_TOKENS[transfer.mint] || 'SPL', 
          });
        }
      }

      // SOL
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        for (const transfer of tx.nativeTransfers) {
          const isSent = transfer.fromUserAccount === publicKey;
          const isReceived = transfer.toUserAccount === publicKey;
          if (isSent || isReceived) {
            const amount = transfer.amount / LAMPORTS_PER_SOL;
            const hasTokenTransfer = tx.tokenTransfers && tx.tokenTransfers.length > 0;
            if (hasTokenTransfer && amount < 0.005) continue;
            if (amount < 0.000001) continue;

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
        }
      }
    }
    
    // Filter duplicates
    const uniqueTxs = transactions.filter((v, i, a) => 
      a.findIndex(t => 
        t.signature === v.signature && 
        t.tokenSymbol === v.tokenSymbol &&
        Math.abs(t.amount - v.amount) < 0.000001
      ) === i
    );

    return uniqueTxs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
  } catch (e) {
    console.error("History error:", e);
    return [];
  }
};