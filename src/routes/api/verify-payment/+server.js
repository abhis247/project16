import crypto from 'crypto';
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

import {
  PRIVATE_SUPABASE_SERVICE_ROLE_KEY,
  PRIVATE_RAZORPAY_KEY_SECRET
} from '$env/static/private';

import { PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST({ request }) {
  console.log('🔥 VERIFY API HIT');

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
    amount
  } = await request.json();

  // 🔐 verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac('sha256', PRIVATE_RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    console.log('❌ SIGNATURE FAILED');

    return json(
      { success: false, message: 'Invalid signature' },
      { status: 400 }
    );
  }

  // ✅ prevent duplicate payment
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference_id', razorpay_payment_id)
    .maybeSingle();

  if (existing) {
    console.log('⚠️ Payment already processed');

    return json({
      success: true,
      message: 'Already processed'
    });
  }

  // ✅ get wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user_id)
    .single();

  if (walletErr || !wallet) {
    console.log('❌ Wallet not found');

    return json(
      { success: false, message: 'Wallet not found' },
      { status: 400 }
    );
  }

  // ✅ update wallet
  const newBalance =
    Number(wallet.balance) + Number(amount);

  const { error: updateErr } = await supabase
    .from('wallets')
    .update({
      balance: newBalance
    })
    .eq('user_id', user_id);

  if (updateErr) {
    console.log(updateErr);

    return json(
      { success: false, message: 'Wallet update failed' },
      { status: 500 }
    );
  }

  // ✅ save transaction
  const { error: insertErr } = await supabase
    .from('transactions')
    .insert({
      user_id,
      amount,
      type: 'credit',
      source: 'razorpay',
      reference_id: razorpay_payment_id
    });

  if (insertErr) {
    console.log(insertErr);

    return json(
      { success: false, message: 'Transaction save failed' },
      { status: 500 }
    );
  }

  return json({
    success: true
  });
}