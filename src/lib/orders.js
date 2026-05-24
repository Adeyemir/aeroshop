/**
 * Order Store (Persistent)
 * 
 * Reads from disk on EVERY access to ensure all API routes
 * see the latest state (critical in Next.js dev mode where
 * different routes may run in separate module instances).
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'orders.json');

/**
 * Read all orders from disk. Called on every access.
 */
function readOrders() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[DB] Failed to read orders:', err.message);
  }
  return {};
}

/**
 * Write all orders to disk.
 */
function writeOrders(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[DB] Failed to save orders:', err.message);
  }
}

export function createOrder(input) {
  const data = typeof input === 'number' ? { amount: input } : input;
  const id = data.id || `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const order = {
    id,
    customerName: data.customerName || null,
    email: data.email || null,
    deliveryAddress: data.deliveryAddress || null,
    item: data.item || null,
    amount: data.amount || 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    depositAddress: null,
    depositPrivateKey: null,
    depositedToUB: false,
    swept: false,
    sweepTxHash: null,
    sweepChain: null,
    spent: false,
    spendTxHash: null,
    spendChain: null,
    txHash: null,
    amountPaid: null,
    paidAt: null,
    paidChain: null
  };
  
  const orders = readOrders();
  orders[id] = order;
  writeOrders(orders);
  return order;
}

export function getOrder(id) {
  const orders = readOrders();
  return orders[id] || null;
}

export function updateOrder(id, updates) {
  const orders = readOrders();
  if (orders[id]) {
    orders[id] = { ...orders[id], ...updates };
    writeOrders(orders);
    return orders[id];
  }
  return null;
}

export function getAllOrders() {
  const orders = readOrders();
  return Object.values(orders).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}
