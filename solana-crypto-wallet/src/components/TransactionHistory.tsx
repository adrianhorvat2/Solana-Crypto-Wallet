import { useState, useEffect } from 'react';
import { getTransactionHistory } from '../services/solanaService';
import type { TransactionRecord } from '../types/wallet';

interface TransactionHistoryProps {
  publicKey: string;
}

export const TransactionHistory = ({ publicKey }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [publicKey]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const txs = await getTransactionHistory(publicKey);
      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      
      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions yet</p>
      ) : (
        <div className="tx-list">
          {transactions.map((tx) => (
            <a
              key={tx.signature}
              href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className={`tx-item ${tx.type}`}
            >
              <div className="tx-icon">
                {tx.type === 'sent' ? '↑' : '↓'}
              </div>
              <div className="tx-details">
                <span className="tx-type">
                  {tx.type === 'sent' ? 'Sent' : 'Received'}
                </span>
                <span className="tx-address">
                  {tx.type === 'sent' ? 'To: ' : 'From: '}
                  {shortenAddress(tx.otherParty)}
                </span>
              </div>
              <div className="tx-amount">
                <span className={tx.type}>
                  {tx.type === 'sent' ? '-' : '+'}
                  {tx.amount.toFixed(4)} {tx.tokenSymbol}
                </span>
                <span className="tx-date">{formatDate(tx.timestamp)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};