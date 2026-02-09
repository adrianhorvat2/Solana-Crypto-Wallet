import { useState, useEffect } from 'react';
import { getTransactionHistory } from '../services/solanaService';
import type { TransactionRecord } from '../types/wallet';

interface TransactionHistoryProps {
  publicKey: string;
}

export const TransactionHistory = ({ publicKey }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, [publicKey]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let txs = await getTransactionHistory(publicKey);
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
        <>
          <div className="tx-list">
            {currentTransactions.map((tx) => (
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

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="pagination-btn"
                style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span>{currentPage} of {totalPages}</span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};