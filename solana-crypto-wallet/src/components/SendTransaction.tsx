import { useState } from 'react';
import { sendSol, getBalance } from '../services/solanaService';
import { getKeypairFromSecretKey } from '../services/walletService';

interface SendTransactionProps {
  secretKey: Uint8Array;
}

export const SendTransaction = ({ secretKey }: SendTransactionProps) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [error, setError] = useState('');

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

      const balance = await getBalance(keypair.publicKey.toBase58());
      if (amountNum > balance) {
        setError('Not enough balance');
        setLoading(false);
        return;
      }

      const signature = await sendSol(keypair, toAddress, amountNum);
      setTxSignature(signature);
      setToAddress('');
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
    setLoading(false);
  };

  return (
    <div className="send-transaction">
      <h3>Send SOL</h3>
      
      <input
        type="text"
        placeholder="Recipient Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      
      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.001"
        min="0"
      />
      
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