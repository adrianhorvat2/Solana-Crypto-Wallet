import { useEffect, useState } from 'react';
import { getBalance, getTokenBalances } from '../services/solanaService';
import type { TokenBalance } from '../types/wallet';

interface TokenListProps {
  publicKey: string;
}

export const TokenList = ({ publicKey }: TokenListProps) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const sol = await getBalance(publicKey);
      const tokenList = await getTokenBalances(publicKey);
      setSolBalance(sol);
      setTokens(tokenList);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [publicKey]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="token-list">
      <h3>Your Tokens</h3>
      
      <div className="sol-balance">
        <span className="token-icon">◎</span>
        <span className="token-name">SOL</span>
        <span className="token-amount">{solBalance.toFixed(4)}</span>
      </div>

      {tokens.length > 0 && (
        <div className="spl-tokens">
          {tokens.map((token, index) => (
            <div key={index} className="token-item">
              <span className="token-name">{token.symbol}</span>
              <span className="token-amount">{token.balance}</span>
            </div>
          ))}
        </div>
      )}

      {tokens.length === 0 && (
        <p className="no-tokens">You don't have any SPL tokens</p>
      )}
      
      <button onClick={fetchBalances} className="btn-secondary">
        Refresh
      </button>
    </div>
  );
};