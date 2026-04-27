import { useState, useEffect } from "react";

function App() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");

  const fetchData = async () => {
    const balRes = await fetch("http://127.0.0.1:8000/api/v1/balance/");
    const balData = await balRes.json();
    setBalance(balData.balance_paise);

    const histRes = await fetch("http://127.0.0.1:8000/api/v1/history/");
    const histData = await histRes.json();
    setHistory(histData);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const handlePayout = async () => {
    await fetch("http://127.0.0.1:8000/api/v1/payouts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ amount_paise: parseInt(amount) }),
    });
    fetchData();
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Merchant Dashboard</h1>
      <div className="bg-blue-100 p-4 rounded mb-4">
        Balance: {balance / 100} INR
      </div>
      <input
        className="border p-2 mr-2"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in paise"
      />
      <button
        className="bg-blue-500 text-white p-2 rounded"
        onClick={handlePayout}
      >
        Request Payout
      </button>
      <ul className="mt-4">
        {history.map((h) => (
          <li key={h.id} className="border-b py-2">
            {h.amount_paise / 100} INR - {h.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default App;
