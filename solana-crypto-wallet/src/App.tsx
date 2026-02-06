import { useState } from 'react';
import { CreateWallet } from './components/CreateWallet';
import { SeedPhraseBackup } from './components/SeedPhraseBackup';
import { TokenList } from './components/TokenList';
import { SendTransaction } from './components/SendTransaction';
import type { WalletData } from './types/wallet';
import { WalletInfo } from './components/WalletInfo';
import './App.css';

type Screen = 'welcome' | 'seedPhrase' | 'walletInfo';

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [wallet, setWallet] = useState<WalletData | null>(null);

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
            <TokenList publicKey={wallet.publicKey} />
            <SendTransaction secretKey={wallet.secretKey} />
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
