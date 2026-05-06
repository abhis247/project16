import Razorpay from 'razorpay';
import { json } from '@sveltejs/kit';
import {
  RAZORPAY_KEY_ID,
  PRIVATE_RAZORPAY_KEY_SECRET
} from '$env/static/private';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

export async function POST({ request }) {
  const { amount } = await request.json();

  if (!amount || amount <= 0) {
    return json({ error: 'Invalid amount' }, { status: 400 });
  }

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: 'receipt_' + Date.now()
  });

  return json(order);
}