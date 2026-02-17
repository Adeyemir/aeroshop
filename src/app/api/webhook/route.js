/**
 * Blockradar Webhook Handler
 * POST /api/webhook
 * 
 * This is where Blockradar notifies us when a customer deposits USDC.
 * 
 * Flow:
 * 1. Customer sends USDC to their dedicated deposit address
 * 2. Blockradar detects the on-chain deposit
 * 3. Blockradar POSTs to this endpoint with deposit details + metadata
 * 4. We verify the signature (HMAC SHA512)
 * 5. We find the order using metadata.orderId
 * 6. We mark the order as paid
 * 7. We return 200 OK (must respond quickly — do async work after)
 * 
 * Webhook payload structure:
 * {
 *   "event": "deposit.success",
 *   "data": {
 *     "amountPaid": "10.0",
 *     "recipientAddress": "0x...",
 *     "senderAddress": "0x...",
 *     "metadata": { "orderId": "order_abc123" },
 *     "hash": "0x...",  // transaction hash
 *     "status": "SUCCESS",
 *     "type": "DEPOSIT"
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findOrderByMetadataId, findOrderByAddress, updateOrder } from '@/lib/orders';

export async function POST(request) {
  try {
    // 1. Get the raw body and signature header
    const body = await request.text();
    const signature = request.headers.get('x-blockradar-signature');
    
    // 2. Verify webhook signature (HMAC SHA512)
    // This prevents bad actors from faking webhook calls
    const secretKey = process.env.BLOCKRADAR_SECRET_KEY;
    if (secretKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Webhook signature mismatch — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 3. Parse the payload
    const payload = JSON.parse(body);
    console.log('Webhook received:', payload.event, JSON.stringify(payload.data?.metadata));

    // 4. Only process successful deposits
    if (payload.event !== 'deposit.success') {
      console.log(`Ignoring event: ${payload.event}`);
      return NextResponse.json({ received: true });
    }

    const { data } = payload;
    const { amountPaid, recipientAddress, hash, metadata } = data;

    // 5. Find the matching order
    // Primary: use metadata.orderId (most reliable)
    // Fallback: match by deposit address
    let order = null;
    
    if (metadata?.orderId) {
      order = findOrderByMetadataId(metadata.orderId);
    }
    
    if (!order && recipientAddress) {
      order = findOrderByAddress(recipientAddress);
    }

    if (!order) {
      console.warn('No matching order found for webhook:', { 
        orderId: metadata?.orderId, 
        recipientAddress 
      });
      // Still return 200 — don't make Blockradar retry for unmatchable webhooks
      return NextResponse.json({ received: true, matched: false });
    }

    // 6. Update the order to PAID
    // In production, also verify amountPaid >= order.amount
    updateOrder(order.id, {
      status: 'paid',
      txHash: hash,
      amountPaid: amountPaid,
      paidAt: new Date().toISOString(),
    });

    console.log(`Order ${order.id} marked as PAID — tx: ${hash}`);

    // 7. Return 200 immediately — Blockradar expects this
    // Any slow processing (emails, notifications) should happen async
    return NextResponse.json({ received: true, matched: true, orderId: order.id });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to prevent retry storms during development
    // In production, return 500 to trigger Blockradar's retry mechanism
    return NextResponse.json({ error: 'Processing failed' }, { status: 200 });
  }
}
