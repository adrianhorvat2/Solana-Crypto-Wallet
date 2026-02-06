import { useState } from 'react';

interface WalletInfoProps {
  publicKey: string;
}

export const WalletInfo = ({ publicKey }: WalletInfoProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wallet-info">
      <p className="label">Your address:</p>
      <p className="address">{publicKey}</p>
      <button 
        onClick={handleCopy}
        className={`btn-small ${copied ? 'copied' : ''}`}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
};