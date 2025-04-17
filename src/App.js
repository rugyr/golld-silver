// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [recycleBin, setRecycleBin] = useState(() => {
    const saved = localStorage.getItem("recycleBin");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    type: "silver", action: "buy", date: "", name: "", amount: "", weight: ""
  });

  const [filters, setFilters] = useState({ date: "", name: "" });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("recycleBin", JSON.stringify(recycleBin));
  }, [recycleBin]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const addTransaction = () => {
    if (!form.date || !form.name || !form.amount || !form.weight) {
      alert("All fields are required!");
      return;
    }
    const newTransaction = {
      ...form,
      amount: +form.amount,
      weight: +form.weight,
    };

    if (editIndex !== null) {
      const updated = [...transactions];
      updated[editIndex] = newTransaction;
      setTransactions(updated);
      setEditIndex(null);
    } else {
      setTransactions([...transactions, newTransaction]);
    }

    setForm({ type: "silver", action: "buy", date: "", name: "", amount: "", weight: "" });
  };

  const cancelEdit = () => {
    setForm({ type: "silver", action: "buy", date: "", name: "", amount: "", weight: "" });
    setEditIndex(null);
  };

  const editTransaction = (index) => {
    if (editIndex !== null) {
      alert("Please finish editing the current transaction first.");
      return;
    }
    const transaction = transactions[index];
    setForm({
      ...transaction,
      amount: transaction.amount.toString(),
      weight: transaction.weight.toString(),
    });
    setEditIndex(index);
  };

  const deleteTransaction = (index) => {
    const deleted = transactions[index];
    setRecycleBin([...recycleBin, deleted]);
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const restoreTransaction = (index) => {
    const restored = recycleBin[index];
    setTransactions([...transactions, restored]);
    setRecycleBin(recycleBin.filter((_, i) => i !== index));
  };

  const deleteFromRecycleBin = (index) => {
    setRecycleBin(recycleBin.filter((_, i) => i !== index));
  };

  const groupTransactions = (type, action) =>
    transactions.filter(t => t.type === type && t.action === action)
      .map(t => [t.date, t.name, `₹${t.amount.toLocaleString()}`, `${t.weight} g`]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Gold & Silver Transactions Report", pageWidth / 2, 25, { align: "center" });

    const tableSections = [
      { title: "Silver - Purchase", data: groupTransactions("silver", "buy") },
      { title: "Silver - Sell", data: groupTransactions("silver", "sell") },
      { title: "Gold - Purchase", data: groupTransactions("gold", "buy") },
      { title: "Gold - Sell", data: groupTransactions("gold", "sell") }
    ];

    let y = 35;

    tableSections.forEach((section) => {
      if (section.data.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(80);
        doc.text(section.title, pageWidth / 2, y, { align: "center" });
        y += 6;
        doc.setDrawColor(200);
        doc.line(20, y, pageWidth - 20, y);
        y += 5;

        doc.autoTable({
          startY: y,
          head: [["Date", "Name", "Amount (₹)", "Weight (g)"]],
          body: section.data,
          theme: "grid",
          styles: {
            fontSize: 10,
            textColor: [60, 60, 60],
            halign: 'center',
          },
          headStyles: {
            fillColor: [230, 230, 230],
            textColor: [40, 40, 40],
            fontStyle: 'bold',
          },
          bodyStyles: {
            fillColor: [250, 250, 250],
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 55 },
            2: { cellWidth: 40 },
            3: { cellWidth: 35 },
          },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
          },
        });

        y = doc.lastAutoTable.finalY + 25;
      }
    });

    doc.save("Transactions_Report.pdf");
  };

  const renderTable = (title, type, action) => {
    const filtered = transactions.filter(t => t.type === type && t.action === action)
      .filter(t => {
        const matchDate = filters.date ? t.date.includes(filters.date) : true;
        const matchName = filters.name ? t.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
        return matchDate && matchName;
      });

    if (!filtered.length) return null;

    return (
      <>
        <h3>{title}</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Date</th><th>Name</th><th>Amount (₹)</th><th>Weight (g)</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const originalIndex = transactions.findIndex(tr =>
                  tr.date === t.date && tr.name === t.name && tr.amount === t.amount &&
                  tr.weight === t.weight && tr.type === t.type && tr.action === t.action
                );
                return (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>{t.name}</td>
                    <td>₹{t.amount.toLocaleString()}</td>
                    <td>{t.weight}</td>
                    <td>
                      <button onClick={() => editTransaction(originalIndex)}>Edit</button>
                      <button onClick={() => deleteTransaction(originalIndex)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const calcSummary = (type) => {
    const buy = transactions.filter(t => t.type === type && t.action === "buy");
    const sell = transactions.filter(t => t.type === type && t.action === "sell");
    const buyAmount = buy.reduce((sum, t) => sum + t.amount, 0);
    const sellAmount = sell.reduce((sum, t) => sum + t.amount, 0);
    const buyWeight = buy.reduce((sum, t) => sum + t.weight, 0);
    const sellWeight = sell.reduce((sum, t) => sum + t.weight, 0);
    const profit = sellAmount - buyAmount;
    const maxSell = Math.max(...sell.map(t => t.amount), 0);
    return { buyAmount, sellAmount, buyWeight, sellWeight, profit, maxSell };
  };

  const avgPrice = (amount, weight) => weight ? (amount / weight).toFixed(2) : 0;
  const profitPercent = (buy, sell) => buy ? (((sell - buy) / buy) * 100).toFixed(2) : "N/A";

  const goldSummary = calcSummary("gold");
  const silverSummary = calcSummary("silver");

  return (
    <div className="App">
      <h1>Gold & Silver Transactions</h1>

      <div className="dashboard">
        <h2>📊 Dashboard Summary</h2>
        <div className="summary-boxes">
          <div className="summary-card">
            <h3>Silver</h3>
            <p>Buy: ₹{silverSummary.buyAmount.toLocaleString()} / {silverSummary.buyWeight}g</p>
            <p>Sell: ₹{silverSummary.sellAmount.toLocaleString()} / {silverSummary.sellWeight}g</p>
            <p>Avg Buy ₹/g: ₹{avgPrice(silverSummary.buyAmount, silverSummary.buyWeight)}</p>
            <p>Avg Sell ₹/g: ₹{avgPrice(silverSummary.sellAmount, silverSummary.sellWeight)}</p>
            <p>Highest Sell: ₹{silverSummary.maxSell.toLocaleString()}</p>
            <p>Profit %: {profitPercent(silverSummary.buyAmount, silverSummary.sellAmount)}%</p>
            <p><strong>{silverSummary.profit >= 0 ? "Profit" : "Loss"}:</strong> ₹{Math.abs(silverSummary.profit).toLocaleString()}</p>
          </div>
          <div className="summary-card">
            <h3>Gold</h3>
            <p>Buy: ₹{goldSummary.buyAmount.toLocaleString()} / {goldSummary.buyWeight}g</p>
            <p>Sell: ₹{goldSummary.sellAmount.toLocaleString()} / {goldSummary.sellWeight}g</p>
            <p>Avg Buy ₹/g: ₹{avgPrice(goldSummary.buyAmount, goldSummary.buyWeight)}</p>
            <p>Avg Sell ₹/g: ₹{avgPrice(goldSummary.sellAmount, goldSummary.sellWeight)}</p>
            <p>Highest Sell: ₹{goldSummary.maxSell.toLocaleString()}</p>
            <p>Profit %: {profitPercent(goldSummary.buyAmount, goldSummary.sellAmount)}%</p>
            <p><strong>{goldSummary.profit >= 0 ? "Profit" : "Loss"}:</strong> ₹{Math.abs(goldSummary.profit).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <h3>📌 Quick Stats</h3>
        <ul>
          <li>Total Buy Transactions: {transactions.filter(t => t.action === "buy").length}</li>
          <li>Total Sell Transactions: {transactions.filter(t => t.action === "sell").length}</li>
          <li>Total Amount Traded: ₹{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</li>
          <li>Total Weight Traded: {transactions.reduce((sum, t) => sum + t.weight, 0)}g</li>
        </ul>
      </div>

      <div className="filters">
        <h3>Filter Transactions</h3>
        <input name="date" placeholder="Date (yyyy-mm-dd)" value={filters.date} onChange={handleFilterChange} />
        <input name="name" placeholder="Name" value={filters.name} onChange={handleFilterChange} />
      </div>

      <div className="form">
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
        </select>
        <select name="action" value={form.action} onChange={handleChange}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input name="date" type="date" value={form.date} onChange={handleChange} />
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="amount" type="number" placeholder="Amount ₹" value={form.amount} onChange={handleChange} />
        <input name="weight" type="number" placeholder="Weight g" value={form.weight} onChange={handleChange} />
        <button onClick={addTransaction}>{editIndex !== null ? "✔️ Update" : "➕ Add"}</button>
        {editIndex !== null && <button onClick={cancelEdit}>❌ Cancel</button>}
        <button onClick={downloadPDF}>📄 Download PDF</button>
      </div>

      {renderTable("Silver Business Transactions - Purchase Details", "silver", "buy")}
      {renderTable("Silver Business Transactions - Sell Details", "silver", "sell")}
      {renderTable("Gold Business Transactions - Purchase Details", "gold", "buy")}
      {renderTable("Gold Business Transactions - Sell Details", "gold", "sell")}

      {recycleBin.length > 0 && (
        <div className="recycle-bin">
          <h3>🗑️ Recycle Bin</h3>
          <table>
            <thead>
              <tr><th>Date</th><th>Name</th><th>Amount (₹)</th><th>Weight (g)</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {recycleBin.map((t, i) => (
                <tr key={i}>
                  <td>{t.date}</td>
                  <td>{t.name}</td>
                  <td>₹{t.amount.toLocaleString()}</td>
                  <td>{t.weight}</td>
                  <td>
                    <button onClick={() => restoreTransaction(i)}>♻️ Restore</button>
                    <button onClick={() => deleteFromRecycleBin(i)}>❌ Delete Permanently</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
