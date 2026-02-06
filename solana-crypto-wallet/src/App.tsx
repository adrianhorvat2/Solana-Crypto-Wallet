import { useState } from 'react';
import { CreateWallet } from './components/CreateWallet';
import { SeedPhraseBackup } from './components/SeedPhraseBackup';
import { TokenList } from './components/TokenList';
import { SendTransaction } from './components/SendTransaction';
import type { WalletData } from './types/wallet';
import { WalletInfo } from './components/WalletInfo';
import { TransactionHistory } from './components/TransactionHistory';
import './App.css';

type Screen = 'welcome' | 'seedPhrase' | 'walletInfo';
type Tab = 'tokens' | 'history';

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('tokens');

  const handleWalletCreated = (newWallet: WalletData, isImport: boolean = false) => {
    setWallet(newWallet);
    setScreen(isImport ? 'walletInfo' : 'seedPhrase');
  };

  const handleBackupConfirmed = () => {
    setScreen('walletInfo');
  };

  const handleLogout = () => {
    setWallet(null);
    setScreen('welcome');
  };

  return (
    <div className="app">
      <header>
        <h1>◎ Solana Wallet</h1>
      </header>

      <main>
        {screen === 'welcome' && (
          <CreateWallet onWalletCreated={handleWalletCreated} />
        )}

        {screen === 'seedPhrase' && wallet && (
          <SeedPhraseBackup 
            mnemonic={wallet.mnemonic} 
            onConfirmed={handleBackupConfirmed} 
          />
        )}

        {screen === 'walletInfo' && wallet && (
          <>
            <WalletInfo publicKey={wallet.publicKey} />
            <SendTransaction secretKey={wallet.secretKey} />
            
            <div className="tab-container">
              <div className="tab-buttons">
                <button 
                  className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tokens')}
                >
                  Tokens
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>
              
              <div className="tab-content">
                {activeTab === 'tokens' && (
                  <TokenList publicKey={wallet.publicKey} />
                )}
                {activeTab === 'history' && (
                  <TransactionHistory publicKey={wallet.publicKey} />
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
