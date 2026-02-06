import { useState } from 'react';

interface SeedPhraseBackupProps {
  mnemonic: string;
  onConfirmed: () => void;
}

export const SeedPhraseBackup = ({ mnemonic, onConfirmed }: SeedPhraseBackupProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div className="seed-backup">
      <h2>Save Your Seed Phrase</h2>
      <p className="warning">
        This is the only way to recover your wallet. 
        Write down these words and keep them in a safe place!
      </p>
      
      <div className="seed-grid">
        {words.map((word, index) => (
          <div key={index} className="seed-word">
            <span className="word-number">{index + 1}.</span>
            <span className="word">{word}</span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleCopy} 
        className={`btn-secondary ${copied ? 'copied' : ''}`}
      >
        {copied ? '✓ Copied' : 'Copy Seed Phrase'}
      </button>
      
      <label className="confirm-checkbox">
        <input 
          type="checkbox" 
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I have saved my seed phrase in a safe place
      </label>
      
      <button 
        onClick={onConfirmed} 
        disabled={!confirmed}
        className="btn-primary"
      >
        Continue
      </button>
    </div>
  );
};