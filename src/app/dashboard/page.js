'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </main>
    );
  }

  const { orders = [], stats = {} } = data || {};

  return (
    <main>
      <div className="dashboard-header">
        <div className="dashboard-tag">AEROFRAME</div>
        <h1>Merchant Dashboard</h1>
        <p>Real-time view of all stablecoin payments</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {stats.paid || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue (USDC)</div>
          <div className="stat-value">
            ${(stats.totalRevenue || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="orders-card">
        <div className="orders-header">
          <h2>Recent Orders</h2>
          <span className="live-indicator">Live</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              No orders yet. Go to the{' '}
              <a href="/" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>store</a>{' '}
              and create one.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {order.id.slice(0, 20)}...
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.item}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ${order.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${order.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                        <span className={`status-dot ${order.status}`} />
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleTimeString()
                        : new Date(order.createdAt).toLocaleTimeString()
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="info-card">
        <div className="info-icon">&#9889;</div>
        <div>
          <div className="info-title">Powered by Blockradar</div>
          <div className="info-text">
            Each order generates a unique deposit address via Blockradar&apos;s API.
            When USDC arrives, Blockradar&apos;s webhook notifies this app with the payment details
            and metadata. Funds are auto-swept to the master wallet. No manual reconciliation needed.
          </div>
        </div>
      </div>
    </main>
  );
}
