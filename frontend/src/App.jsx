import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function App() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const balRes = await fetch(`${API_BASE}/api/v1/balance/`);
      const balData = await balRes.json();
      setBalance(balData.balance_paise);

      const histRes = await fetch(`${API_BASE}/api/v1/history/`);
      const histData = await histRes.json();
      setHistory(histData);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, []);

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
    </div>
  );
}
export default App;
