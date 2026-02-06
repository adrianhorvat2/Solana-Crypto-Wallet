import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import type { WalletData } from '../types/wallet';

export const createWallet = (): WalletData => {
  const mnemonic = bip39.generateMnemonic();
  
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  const derivationPath = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
  
  const keypair = Keypair.fromSeed(derivedSeed);
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic: mnemonic,
  };
};

export const importWallet = (mnemonic: string): WalletData | null => {
  if (!bip39.validateMnemonic(mnemonic)) {
    return null;
  }
  
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derivationPath = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
  const keypair = Keypair.fromSeed(derivedSeed);
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
    mnemonic: mnemonic,
  };
};

export const getKeypairFromSecretKey = (secretKey: Uint8Array): Keypair => {
  return Keypair.fromSecretKey(secretKey);
};