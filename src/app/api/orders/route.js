/**
 * Dashboard Data Endpoint
 * GET /api/orders
 * 
 * Returns all orders for the merchant dashboard.
 * In production, this would be behind authentication.
 */

import { NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/orders';

export async function GET() {
  const orders = getAllOrders();

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    pending: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + (parseFloat(o.amountPaid) || o.amount), 0),
  };

  return NextResponse.json({ orders, stats });
}
