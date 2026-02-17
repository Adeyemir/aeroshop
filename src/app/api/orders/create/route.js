/**
 * Create Order Endpoint
 * POST /api/orders/create
 * 
 * Called when customer clicks "Pay with USDC" on a product.
 * 
 * Steps:
 * 1. Generate a unique order ID
 * 2. Create the order in our store
 * 3. Call Blockradar API to generate a dedicated deposit address
 *    (with orderId in metadata for webhook matching)
 * 4. Return the order + deposit address to the frontend
 */

import { NextResponse } from 'next/server';
import { createOrder, updateOrder } from '@/lib/orders';
import { generateAddress } from '@/lib/blockradar';

export async function POST(request) {
  try {
    const { customerName, email, deliveryAddress, item, amount } = await request.json();

    // Validate input
    if (!customerName || !item || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, item, amount' },
        { status: 400 }
      );
    }

    // 1. Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 2. Create order in store (status: pending)
    const order = createOrder({
      id: orderId,
      customerName,
      email,
      deliveryAddress,
      item,
      amount: parseFloat(amount),
    });

    // 3. Call Blockradar to generate deposit address
    // The orderId goes into metadata — Blockradar returns it in webhooks
    const { address, blockchain } = await generateAddress(orderId, customerName);

    // 4. Link the deposit address to our order
    updateOrder(orderId, {
      depositAddress: address,
      blockchain: blockchain,
    });

    // 5. Return everything the frontend needs
    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        item,
        amount: parseFloat(amount),
        depositAddress: address,
        blockchain,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
