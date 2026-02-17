/**
 * Blockradar API Client
 * 
 * Two key operations:
 * 1. generateAddress() - Creates a dedicated deposit address for a customer
 *    with metadata (orderId) so webhooks can identify which order was paid.
 * 2. getWallet() - Fetches master wallet info (balances, address count).
 * 
 * API Docs: https://docs.blockradar.co
 */

const BASE_URL = process.env.BLOCKRADAR_BASE_URL || 'https://api.blockradar.co/v1';
const API_KEY = process.env.BLOCKRADAR_API_KEY;
const WALLET_ID = process.env.BLOCKRADAR_WALLET_ID;

async function blockradarRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Blockradar API error:', data);
    throw new Error(data.message || `Blockradar API error: ${res.status}`);
  }

  return data;
}

/**
 * Generate a dedicated deposit address for an order.
 * 
 * The metadata is KEY — when Blockradar fires the webhook on deposit,
 * it includes this same metadata, so we can match it to our order.
 * 
 * Auto-sweep is enabled by default on the master wallet,
 * so funds deposited here automatically move to your treasury.
 */
export async function generateAddress(orderId, customerName) {
  const data = await blockradarRequest(`/wallets/${WALLET_ID}/addresses`, {
    method: 'POST',
    body: JSON.stringify({
      name: `Order ${orderId}`,
      metadata: {
        orderId: orderId,
        customerName: customerName,
        createdAt: new Date().toISOString(),
      },
    }),
  });

  return {
    address: data.data.address,
    addressId: data.data.id,
    blockchain: data.data.blockchain?.name || 'base',
  };
}

/**
 * Get master wallet info — useful for the merchant dashboard
 * to show total balance and wallet health.
 */
export async function getWallet() {
  const data = await blockradarRequest(`/wallets/${WALLET_ID}`);
  return data.data;
}

/**
 * Get wallet balances — shows how much USDC has been collected
 */
export async function getWalletBalances() {
  const data = await blockradarRequest(`/wallets/${WALLET_ID}/balances`);
  return data.data;
}

/**
 * Get all generated addresses — shows all customer deposit addresses
 */
export async function getAddresses() {
  const data = await blockradarRequest(`/wallets/${WALLET_ID}/addresses`);
  return data.data;
}
