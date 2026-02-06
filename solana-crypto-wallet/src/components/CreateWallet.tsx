import { useState } from 'react';
import { createWallet, importWallet } from '../services/walletService';
import type { WalletData } from '../types/wallet';

interface CreateWalletProps {
  onWalletCreated: (wallet: WalletData, isImport?: boolean) => void;
}

export const CreateWallet = ({ onWalletCreated }: CreateWalletProps) => {
  const [showImport, setShowImport] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    const wallet = createWallet();
    onWalletCreated(wallet, false);
  };

  const handleImport = () => {
    setError('');
    const wallet = importWallet(importMnemonic.trim());
    
    if (wallet) {
      onWalletCreated(wallet, true);
    } else {
      setError('Invalid seed phrase. Please check and try again.');
    }
  };

  return (
    <div className="create-wallet">
      <h2>Solana Wallet</h2>
      
      {!showImport ? (
        <div className="create-section">
          <button onClick={handleCreate} className="btn-primary">
            Create New Wallet
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            Import Existing Wallet
          </button>
        </div>
      ) : (
        <div className="import-section">
          <textarea
            placeholder="Enter your seed phrase (12 words separated by spaces)"
            value={importMnemonic}
            onChange={(e) => setImportMnemonic(e.target.value)}
            rows={3}
          />
          {error && <p className="error">{error}</p>}
          <button onClick={handleImport} className="btn-primary">
            Import Wallet
          </button>
          <button onClick={() => setShowImport(false)} className="btn-secondary">
            Back
          </button>
        </div>
      )}
    </div>
  );
};