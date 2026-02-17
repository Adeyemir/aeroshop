/**
 * Order Store (In-Memory)
 * 
 * In production, replace this with Supabase:
 *   const { data } = await supabase.from('orders').insert({...})
 * 
 * Order lifecycle:
 *   PENDING → customer hasn't paid yet
 *   PAID    → webhook confirmed deposit
 *   EXPIRED → (optional) timeout after X minutes
 * 
 * The critical link: order.depositAddress matches the address
 * Blockradar sends in the webhook's recipientAddress field.
 * And order.id matches metadata.orderId in the webhook payload.
 */

// In-memory store — resets on server restart
// Use globalThis to persist across Next.js hot reloads in development
const orders = globalThis.__stablepay_orders || new Map();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__stablepay_orders = orders;
}

export function createOrder({ id, customerName, email, deliveryAddress, item, amount }) {
  const order = {
    id,
    customerName,
    email: email || null,
    deliveryAddress: deliveryAddress || null,
    item,
    amount,             // USDC amount
    status: 'pending',  // pending | paid | expired
    depositAddress: null,
    blockchain: null,
    txHash: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return order;
}

export function getOrder(id) {
  return orders.get(id) || null;
}

export function updateOrder(id, updates) {
  const order = orders.get(id);
  if (!order) return null;
  const updated = { ...order, ...updates };
  orders.set(id, updated);
  return updated;
}

export function getAllOrders() {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Find order by deposit address — used by webhook handler
 * When Blockradar fires webhook, we get recipientAddress
 * and need to find which order it belongs to.
 */
export function findOrderByAddress(address) {
  for (const order of orders.values()) {
    if (order.depositAddress?.toLowerCase() === address?.toLowerCase()) {
      return order;
    }
  }
  return null;
}

/**
 * Find order by orderId from metadata — primary webhook lookup method.
 * The metadata.orderId we attached when generating the address
 * comes back in the webhook payload.
 */
export function findOrderByMetadataId(orderId) {
  return orders.get(orderId) || null;
}
