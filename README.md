# AEROFRAME

A stablecoin-powered e-commerce storefront for digital creator assets. Customers browse products, pay with USDC on Base network, and receive instant on-chain payment confirmation. Built with Next.js 14 and [Blockradar](https://blockradar.co) wallet infrastructure.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![USDC](https://img.shields.io/badge/USDC-Base%20Network-2775CA)
![Blockradar](https://img.shields.io/badge/Powered%20by-Blockradar-111111)

## How It Works

```
Customer clicks "Pay with USDC"
        │
        ▼
Modal collects name, email, delivery address
        │
        ▼
Backend creates order + generates unique deposit address via Blockradar API
        │
        ▼
Checkout page shows QR code + address, polls for payment status every 3s
        │
        ▼
Customer sends USDC from any wallet on Base network
        │
        ▼
Blockradar detects on-chain deposit → fires webhook to /api/webhook
        │
        ▼
Webhook handler verifies signature, matches order, marks as PAID
        │
        ▼
Checkout page auto-updates → shows professional receipt with tx hash
```

## Features

- **Storefront** — Clean product grid with modal checkout flow (name, email, delivery address)
- **Unique Deposit Addresses** — Each order gets a dedicated address via Blockradar, no shared wallet confusion
- **QR Code Checkout** — Scan-to-pay with real-time payment detection
- **Webhook Verification** — HMAC SHA-512 signature verification on incoming Blockradar webhooks
- **On-Chain Receipt** — Success page with order details, customer info, and tx hash linked to Base block explorer
- **Merchant Dashboard** — Live order feed, payment stats, and revenue tracking with auto-refresh
- **Responsive Design** — Works across desktop, tablet, and mobile with adaptive layouts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, CSS (no UI library) |
| Payments | Blockradar API (deposit address generation, webhooks) |
| Network | Base (Ethereum L2) — USDC |
| QR Codes | `qrcode` npm package |
| State | In-memory Map (swap for Supabase/Postgres in production) |

## Project Structure

```
src/
├── app/
│   ├── page.js                    # Storefront — product grid + checkout modal
│   ├── checkout/page.js           # Payment page — QR, address, receipt
│   ├── dashboard/page.js          # Merchant dashboard — orders + stats
│   ├── layout.js                  # Root layout — nav, footer
│   ├── globals.css                # All styles
│   └── api/
│       ├── orders/
│       │   ├── create/route.js    # POST — create order + generate deposit address
│       │   ├── status/route.js    # GET  — poll order status (checkout page)
│       │   └── route.js           # GET  — all orders (dashboard)
│       └── webhook/route.js       # POST — Blockradar webhook handler
├── lib/
│   ├── orders.js                  # Order store (in-memory Map)
│   └── blockradar.js              # Blockradar API client
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Blockradar](https://blockradar.co) account with a Base wallet
- [ngrok](https://ngrok.com) (for local webhook testing)

### 1. Clone and install

```bash
git clone https://github.com/Adeyemir/Aeroframe.git
cd Aeroframe
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Blockradar credentials:

```env
BLOCKRADAR_API_KEY=your_api_key_here
BLOCKRADAR_WALLET_ID=your_wallet_id_here
BLOCKRADAR_SECRET_KEY=your_webhook_secret_here
BLOCKRADAR_BASE_URL=https://api.blockradar.co/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Set up webhooks (local development)

Start an ngrok tunnel pointing to your dev server:

```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL and configure it as your webhook endpoint in the Blockradar dashboard:

```
https://your-id.ngrok-free.app/api/webhook
```

### 5. Test a payment

1. Go to the storefront and click **Pay with USDC** on any product
2. Fill in your details in the modal and click **Proceed to Payment**
3. Send testnet USDC to the displayed deposit address on Base Sepolia
4. Watch the checkout page auto-update when payment is confirmed
5. View the transaction on the **Merchant Dashboard** at `/dashboard`

## API Reference

### `POST /api/orders/create`

Creates a new order and generates a Blockradar deposit address.

**Request body:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "deliveryAddress": "Digital delivery",
  "item": "DJI Mini 4 Pro — 3D Model File",
  "amount": 12.00
}
```

### `GET /api/orders/status?id=order_xxx`

Returns the current status of an order. Polled by the checkout page every 3 seconds.

### `GET /api/orders`

Returns all orders with aggregate stats. Used by the merchant dashboard.

### `POST /api/webhook`

Receives Blockradar webhook events. Verifies HMAC SHA-512 signature, matches the deposit to an order via `metadata.orderId`, and marks it as paid.

## Production Notes

- Replace the in-memory order store (`src/lib/orders.js`) with a database (Supabase, Postgres, etc.)
- Enable webhook signature verification by setting `BLOCKRADAR_SECRET_KEY`
- Add authentication to the merchant dashboard
- Switch from Base Sepolia testnet to Base mainnet in your Blockradar wallet config

## Author

**Adeyemir** — [@Adeyemir](https://github.com/Adeyemir)

## License

ISC
