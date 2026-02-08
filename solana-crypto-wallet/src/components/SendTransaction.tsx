import { useState, useEffect } from "react";
import {
  sendSol,
  sendToken,
  getBalance,
  getTokenBalances,
} from "../services/solanaService";
import { getKeypairFromSecretKey } from "../services/walletService";
import type { TokenBalance } from "../types/wallet";

interface SendTransactionProps {
  secretKey: Uint8Array;
  onTransactionSuccess?: () => void;
}

export const SendTransaction = ({ secretKey, onTransactionSuccess }: SendTransactionProps) => {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [error, setError] = useState("");
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]);
  const [selectedTokenMint, setSelectedTokenMint] = useState<string>("SOL");

  const fetchAssets = async () => {
    try {
      const keypair = getKeypairFromSecretKey(secretKey);
      const pubKey = keypair.publicKey.toBase58();

      const solBal = await getBalance(pubKey);
      const solToken: TokenBalance = {
        mint: "SOL",
        symbol: "SOL",
        balance: solBal,
        decimals: 9,
      };

      const splTokens = await getTokenBalances(pubKey);
      setAvailableTokens([solToken, ...splTokens]);

      if ((!selectedTokenMint || selectedTokenMint === 'SOL') && [solToken, ...splTokens].length > 0) {
        setSelectedTokenMint('SOL');
      }
    } catch (e) {
      console.error("Error loading tokens", e);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [secretKey]);

  const handleSend = async () => {
    setError("");
    setTxSignature("");

    if (!toAddress || !amount) {
      setError("Enter recipient address and amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount");
      return;
    }

    setLoading(true);
    try {
      const keypair = getKeypairFromSecretKey(secretKey);
      const tokenInfo = availableTokens.find((t) => t.mint === selectedTokenMint);
      
      if (!tokenInfo) throw new Error("Token info not found");
      if (amountNum > tokenInfo.balance) throw new Error(`Not enough ${tokenInfo.symbol} balance`);

      let signature = "";
      if (selectedTokenMint === "SOL") {
        signature = await sendSol(keypair, toAddress, amountNum);
      } else {
        signature = await sendToken(keypair, toAddress, amountNum, selectedTokenMint);
      }

      setTxSignature(signature);
      setToAddress("");
      setAmount("");

      if (onTransactionSuccess) {
        setTimeout(() => {
          onTransactionSuccess();
          fetchAssets();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction failed");
    }
    setLoading(false);
  };

  const currentTokenSymbol = availableTokens.find(t => t.mint === selectedTokenMint)?.symbol || "";

  return (
    <div className="send-transaction">      
      <div className="form-group">
        <label>Select Asset</label>
        <select
          value={selectedTokenMint}
          onChange={(e) => setSelectedTokenMint(e.target.value)}
          className="token-select"
        >
          {availableTokens.length === 0 ? (
            <option>Loading assets...</option>
          ) : (
            availableTokens.map((token) => (
              <option key={token.mint} value={token.mint}>
                {token.symbol}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Recipient Address</label>
        <input
          type="text"
          placeholder="e.g. 44jpYyaqD1epheBGEHf2EBcqKAmE6QwhrZEGTEpUFwxC"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Amount {currentTokenSymbol && `(${currentTokenSymbol})`}</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.000001"
          min="0"
        />
      </div>

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

      <button onClick={handleSend} disabled={loading} className="btn-primary">
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
};