import React, { useState } from 'react';

// Scenario 3 Fix: Unique UUID generation for items with identical names
const initialItems = [
  { id: 'item-101', name: 'Heinz Ketchup', owner: 'Alex', totalQty: 100, remainingQty: 25, isLocked: false },
  { id: 'item-102', name: 'Heinz Ketchup', owner: 'Jordan', totalQty: 100, remainingQty: 100, isLocked: false },
  { id: 'item-103', name: 'Leftover Pasta', owner: 'Casey', totalQty: 100, remainingQty: 50, isLocked: false }
];

export default function App() {
  const [items, setItems] = useState(initialItems);
  const [approvals, setApprovals] = useState([
    // Scenario 2 Sample: Stale pending approval older than 24 hours
    { id: 'appr-1', itemId: 'item-103', requester: 'Jordan', amount: 50, status: 'approved', timestamp: Date.now() - (25 * 60 * 60 * 1000) }
  ]);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // SCENARIO 1: Concurrency Collision Guard
  const handleConcurrentRequest = (itemId, user, amount) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === itemId);
      if (!item || item.isLocked || item.remainingQty < amount) {
        addLog(`BLOCKED: Request by ${user} for ${amount}% failed due to concurrency collision/insufficient quantity.`);
        return prevItems;
      }
      
      // Atomic Lock & Deduction
      addLog(`SUCCESS: Allocated ${amount}% of ${item.name} (ID: ${item.id}) to ${user}.`);
      return prevItems.map((i) =>
        i.id === itemId
          ? { ...i, remainingQty: i.remainingQty - amount, isLocked: true }
          : i
      );
    });

    // Unlock after processing transaction
    setTimeout(() => {
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === itemId ? { ...i, isLocked: false } : i))
      );
    }, 1000);
  };

  // SCENARIO 2: Spoilage / Stale State Expiration Guard
  const cleanupStaleApprovals = () => {
    const NOW = Date.now();
    const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 Hours

    setApprovals((prevApprovals) =>
      prevApprovals.map((appr) => {
        if (appr.status === 'approved' && NOW - appr.timestamp > EXPIRATION_TIME) {
          addLog(`EXPIRED: Pending approval ${appr.id} for item ${appr.itemId} expired and marked spoiled.`);
          return { ...appr, status: 'expired_spoiled' };
        }
        return appr;
      })
    );
  };

  // SCENARIO 4: Reality Desync / Manual Inventory Audit Fix
  const handleManualOverride = (itemId, actualQty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, remainingQty: Number(actualQty) } : i))
    );
    addLog(`REALITY CORRECTION: Item ${itemId} manually adjusted to ${actualQty}%.`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <h1>FridgePolice Prototype 🍕👮</h1>
      <p><i>Defending shared fridge inventory against real-world chaos.</i></p>

      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Fridge Inventory</h2>
        {items.map((item) => (
          <div key={item.id} style={{ padding: '10px', background: '#f9f9f9', marginBottom: '10px', borderRadius: '4px' }}>
            <strong>{item.name}</strong> (Owner: {item.owner}) | 
            <span> Unique ID: <code>{item.id}</code></span> | 
            <b> Qty Left: {item.remainingQty}%</b>
            {item.isLocked && <span style={{ color: 'red', marginLeft: '10px' }}>[LOCKED - Processing]</span>}
            
            <div style={{ marginTop: '8px' }}>
              {/* Scenario 1 Simulation */}
              <button onClick={() => handleConcurrentRequest(item.id, 'Jordan', 25)}>Jordan Request 25%</button>{' '}
              <button onClick={() => handleConcurrentRequest(item.id, 'Casey', 25)}>Casey Request 25%</button>{' '}
              
              {/* Scenario 4 Reality Correction */}
              <button onClick={() => handleManualOverride(item.id, 0)}>Report Consumed/Empty (0%)</button>
            </div>
          </div>
        ))}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Pending Approvals & Spoilage Cleanup</h2>
        <button onClick={cleanupStaleApprovals} style={{ background: '#ff9800', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
          Run Expiration Check (Cleanup Stale Approvals)
        </button>
        <ul>
          {approvals.map((a) => (
            <li key={a.id}>
              Approval {a.id} for Item {a.itemId} - Status: <b>{a.status}</b>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h2>System Activity Logs</h2>
        <pre style={{ background: '#222', color: '#00ff00', padding: '10px', borderRadius: '4px', height: '150px', overflowY: 'scroll' }}>
          {logs.join('\n')}
        </pre>
      </section>
    </div>
  );
}