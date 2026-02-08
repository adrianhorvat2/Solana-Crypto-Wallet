import { useState, useEffect } from 'react';
import { sendSol, sendToken, getBalance, getTokenBalances } from '../services/solanaService';
import { getKeypairFromSecretKey } from '../services/walletService';
import type { TokenBalance } from '../types/wallet';

interface SendTransactionProps {
  secretKey: Uint8Array;
}

export const SendTransaction = ({ secretKey }: SendTransactionProps) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [error, setError] = useState('');  
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]);
  const [selectedTokenMint, setSelectedTokenMint] = useState<string>('SOL');

  // Load SOL & SPL tokens
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const keypair = getKeypairFromSecretKey(secretKey);
        const pubKey = keypair.publicKey.toBase58();

        const solBal = await getBalance(pubKey);
        const solToken: TokenBalance = {
            mint: 'SOL',
            symbol: 'SOL',
            balance: solBal,
            decimals: 9
        };

        const splTokens = await getTokenBalances(pubKey);

        setAvailableTokens([solToken, ...splTokens]);
      } catch (e) {
        console.error("Error loading tokens for dropdown", e);
      }
    };

    fetchAssets();
  }, [secretKey, txSignature]);

  const handleSend = async () => {
    setError('');
    setTxSignature('');
    
    if (!toAddress || !amount) {
      setError('Enter recipient address and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);
    try {
      const keypair = getKeypairFromSecretKey(secretKey);
      
      const tokenInfo = availableTokens.find(t => t.mint === selectedTokenMint);
      
      if (!tokenInfo) throw new Error("Token info not found");
      if (amountNum > tokenInfo.balance) {
        throw new Error(`Not enough ${tokenInfo.symbol} balance`);
      }

      let signature = '';

      // Logic check: Which token is being sent
      if (selectedTokenMint === 'SOL') {
        signature = await sendSol(keypair, toAddress, amountNum);
      } else {
        signature = await sendToken(keypair, toAddress, amountNum, selectedTokenMint);
      }

      setTxSignature(signature);
      setToAddress('');
      setAmount('');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed');
    }
    setLoading(false);
  };

  return (
    <div className="send-transaction">      
      {/* Dropdown */}
      <div className="form-group">
        <label>Select Asset:</label>
        <select 
            value={selectedTokenMint} 
            onChange={(e) => setSelectedTokenMint(e.target.value)}
            className="token-select"
        >
            {availableTokens.map((token) => (
                <option key={token.mint} value={token.mint}>
                    {token.symbol} (Balance: {token.balance})
                </option>
            ))}
        </select>
      </div>

      {/* Address */}
      <div className="form-group">
        <label>Recipient Address</label>
        <input 
        type="text"
        placeholder="Paste address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        />
      </div>
      
      {/* Amount */}
      <div className="form-group">
        <label>Amount</label>
        <input 
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.000001"
        min="0"
        />
      </div>
      
      {error && <p className="error">{error}</p>}
      
      {txSignature && (
        <div className="success">
          <p>Transaction successful!</p>
          <a 
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
      
      <button 
        onClick={handleSend} 
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};