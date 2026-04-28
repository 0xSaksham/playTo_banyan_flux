import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function App() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isWaking, setIsWaking] = useState(false);

  const fetchData = useCallback(function fetchDataInner() {
    setIsWaking(true);
    setMessage(""); // Clear old messages

    Promise.all([
      fetch(`${API_BASE}/api/v1/balance/`),
      fetch(`${API_BASE}/api/v1/history/`),
    ])
      .then(([balRes, histRes]) => {
        if (!balRes.ok || !histRes.ok) throw new Error("Server sleeping");

        return Promise.all([balRes.json(), histRes.json()]);
      })
      .then(([balData, histData]) => {
        setBalance(balData.balance_paise);
        setHistory(histData);
        setIsWaking(false);
      })
      .catch((e) => {
        console.warn("Fetch failed, retrying...", e.message);
        setMessage("Backend is spinning up (takes ~30s). Retrying...");

        // use the named function for retry to avoid TDZ issues
        setTimeout(() => fetchDataInner(), 5000);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayout = async () => {
    if (!amount || amount <= 0) return;

    const res = await fetch(`${API_BASE}/api/v1/payouts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ amount_paise: parseInt(amount) }),
    });

    if (res.ok) {
      setMessage("Your request is accepted and is now processing!");
      setAmount("");
      fetchData();
      setTimeout(() => setMessage(""), 5000); // Clear message after 5s
    } else {
      setMessage("Request failed: Insufficient funds or error.");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Playto Merchant Dashboard</h1>

      <div className="bg-gray-800 text-white p-6 rounded-lg mb-6">
        <p className="text-sm text-gray-400">Available Balance</p>
        <p className="text-4xl font-mono">{balance / 100} INR</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded grow"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (in paise)"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handlePayout}
        >
          Request Payout
        </button>
      </div>

      {message && (
        <div className="bg-green-100 text-green-800 p-3 mb-4 rounded">
          {message}
        </div>
      )}

      <h2 className="font-bold mb-2">Recent Payouts</h2>
      <div className="border rounded">
        {history.map((h) => (
          <div key={h.id} className="p-3 border-b flex justify-between">
            <span>{h.amount_paise / 100} INR</span>
            <span className="font-bold text-sm uppercase">{h.status}</span>
          </div>
        ))}
      </div>
      {isWaking && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow">
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded text-xs mb-4"
            onClick={() => {
              setMessage("Waking up server...");
              fetchData();
            }}
          >
            Force Wake Up Backend
          </button>
        </div>
      )}
    </div>
  );
}
export default App;
