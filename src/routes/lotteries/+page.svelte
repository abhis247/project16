<script>
  import { Sparkles, Ticket } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let lotteries = [];
  let numbers = [];
  let wallet = { balance: 0 };

  let selectedLotteryId = '';
  let selectedNumberId = '';
  let selectedNumber = null;

  let showModal = false;
  let error = '';

  let user_id = localStorage.getItem('user_id'); // ⚠️ temp only





  // ================= LOAD =================
  async function loadLotteries() {
    const { data } = await supabase
      .from('lotteries')
      .select('*')
      .eq('status', 'active');

    lotteries = data || [];

    if (lotteries.length > 0) {
      selectedLotteryId = lotteries[0].id;
    }
  }

  async function loadNumbers() {
    if (!selectedLotteryId) return;

    const { data } = await supabase
      .from('lottery_numbers')
      .select('*')
      .eq('lottery_id', selectedLotteryId)
      .order('number', { ascending: true });

    numbers = data || [];
  }

  async function loadWallet() {
    if (!user_id) return;

    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    wallet = data || { balance: 0 };
  }

  // ================= REACTIVE =================
  $: selectedLottery =
    lotteries.find((l) => l.id === selectedLotteryId) ?? lotteries[0];

  $: if (selectedLotteryId) {
    loadNumbers();
  }

  // ================= ACTION =================
  function selectNumber(numberId) {
    selectedNumberId = numberId;
    selectedNumber = numbers.find(n => n.id === numberId);
    showModal = true;
    error = '';
  }

  async function enterLottery() {
    if (!selectedNumberId) {
      error = 'Select number first';
      return;
    }

    const cost = selectedLottery.entry_fee;

    if (wallet.balance < cost) {
      error = 'Insufficient wallet balance';
      return;
    }

    // 1. check number
    const { data: number } = await supabase
      .from('lottery_numbers')
      .select('*')
      .eq('id', selectedNumberId)
      .single();

    if (!number || number.status !== 'available') {
      error = 'Number already taken';
      return;
    }

    // 2. reserve
    const { data: updated } = await supabase
      .from('lottery_numbers')
      .update({
        status: 'reserved',
        user_id
      })
      .eq('id', selectedNumberId)
      .eq('status', 'available')
      .select();

    if (!updated || !updated.length) {
      error = 'Already booked';
      return;
    }

    // 3. deduct wallet
    await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - cost
      })
      .eq('user_id', user_id);

    // 4. transaction
    await supabase.from('transactions').insert({
      user_id,
      amount: cost,
      type: 'debit',
      source: 'lottery_entry'
    });

    // 5. entry
    await supabase.from('entries').insert({
      user_id,
      lottery_id: selectedLotteryId,
      number: number.number
    });

    // refresh
    await loadNumbers();
    await loadWallet();

    showModal = false;
    selectedNumberId = '';
    selectedNumber = null;
    error = '';
  }



  let addAmount = 0;
let requiredAmount = 0;

// auto calculate required
$: requiredAmount = Math.max(
  (selectedLottery?.entry_fee || 0) - wallet.balance,
  0
);

// auto set add amount
$: if (requiredAmount > 0) {
  addAmount = requiredAmount;
}
  
async function addMoney() {
  const amount = addAmount;

  // 1. create order
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });

  const order = await res.json();

  // 2. open Razorpay
  const options = {
    key: 'rzp_test_Sla0LfPGKGA4o6',
    amount: order.amount,
    currency: 'INR',
    name: 'LotteryPro',
    description: 'Add Money',
    order_id: order.id,

    handler: async function (response) {
      // 3. verify payment
      await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...response,
          user_id,
          amount
        })
      });

      // 4. refresh wallet
      await loadWallet();
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

  onMount(() => {
    loadLotteries();
    loadWallet();
  });
</script>

<AppShell>
  <span slot="title">Lotteries</span>

  <section class="lottery-layout">

    <!-- LEFT -->
    <div class="lottery-stack">
      {#each lotteries as lottery}
        <button
          class:active={selectedLotteryId === lottery.id}
          class="lottery-card"
          on:click={() => selectedLotteryId = lottery.id}
        >
          <span class="pill">{lottery.status}</span>
          <strong>{lottery.name}</strong>
          <small>₹{lottery.prize}</small>
          <div>
            <span>₹{lottery.entry_fee}</span>
          </div>
        </button>
      {/each}
    </div>

    <!-- RIGHT -->
    <div class="panel draw-panel">
      <div class="panel-heading">
        <div>
          <p>System generated numbers</p>
          <h2>{selectedLottery?.name}</h2>
        </div>
        <Sparkles size={28} />
      </div>

      <p style="font-size:0.9rem;color:#94a3b8;">
        Wallet: ₹{wallet.balance}
      </p>

      <div class="number-grid">
        {#each numbers as number}
          <button
            class:reserved={number.status === 'reserved'}
            disabled={number.status === 'reserved'}
            on:click={() => selectNumber(number.id)}
          >
            {number.number}
          </button>
        {/each}
      </div>
    </div>

  </section>

  <!-- MODAL -->
  {#if showModal}
    <div class="modal-backdrop" on:click={() => showModal = false}></div>

    <div class="modal">
  
<!-- MODAL CONTENT -->
<h3>Confirm Entry</h3>

<div class="modal-content">
  <p><strong>Number:</strong> {selectedNumber?.number}</p>
  <p><strong>Cost:</strong> ₹{selectedLottery?.entry_fee}</p>
  <p><strong>Wallet:</strong> ₹{wallet.balance}</p>

  {#if wallet.balance < selectedLottery?.entry_fee}
    <div class="warning-box">
      <p>
  You need ₹{requiredAmount} more to enter
</p>

<button class="add-money" on:click={addMoney}>
  + Add ₹{addAmount}
</button>
    </div>
  {/if}
</div>

<div class="modal-actions">
  <button class="cancel" on:click={() => showModal = false}>
    Cancel
  </button>

  <button 
    class="confirm"
    disabled={wallet.balance < selectedLottery?.entry_fee}
    on:click={enterLottery}
  >
    <Ticket size={16}/> Confirm Entry
  </button>
</div>


    </div>
  {/if}

</AppShell>

<style>
/* warning box */
.warning-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;

  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);

  text-align: center;
}

.warning-box p {
  font-size: 0.9rem;
  color: #f87171;
  margin-bottom: 8px;
}

/* add money button */
.add-money {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 700;
}

/* disabled confirm */
.confirm:disabled {
  background: rgba(148,163,184,0.2);
  color: #94a3b8;
  cursor: not-allowed;
}
/* modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #0f172a;
  padding: 20px;
  border-radius: 14px;
  width: 320px;
  color: white;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.cancel {
  flex: 1;
  padding: 10px;
  background: #334155;
  border-radius: 8px;
}

.confirm {
  flex: 1;
  padding: 10px;
  background: #22c55e;
  border-radius: 8px;
}

/* reserved */
.number-grid button.reserved {
  text-decoration: line-through;
  color: #94a3b8;
}



  .field-error {
    color: #dc2626;
    font-size: 0.88rem;
    font-weight: 700;
    margin: 10px 0 0;
  }


/* ================= LAYOUT ================= */
.lottery-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

/* ================= LEFT STACK ================= */
.lottery-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ================= LOTTERY CARD ================= */
.lottery-card {
  padding: 16px;
  border-radius: 18px;

  background: rgba(30,41,59,0.9);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  display: flex;
  flex-direction: column;
  gap: 6px;

  text-align: left;

  transition: 0.25s;
}

/* hover */
.lottery-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 50px rgba(0,0,0,0.35);
  border-color: rgba(56,189,248,0.3);
}

/* active */
.lottery-card.active {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  box-shadow: 0 15px 45px rgba(59,130,246,0.4);
}

/* inner text */
.lottery-card strong {
  font-size: 1rem;
  font-weight: 800;
}

.lottery-card small {
  color: #94a3b8;
}

/* bottom row */
.lottery-card div {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #cbd5f5;
}

/* ================= PANEL ================= */
.panel {
  border-radius: 22px;
  padding: 22px;

  background: rgba(30,41,59,0.9);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);

  transition: 0.3s;
}

.panel:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
}

/* ================= HEADING ================= */
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= NUMBER GRID ================= */
.number-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin: 20px 0;
}

/* ================= NUMBER BUTTON ================= */
.number-grid button {
  border-radius: 14px;
  padding: 14px;

  background: rgba(15,23,42,0.8);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  font-weight: 700;

  transition: 0.25s;
}

/* hover */
.number-grid button:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  border-color: rgba(56,189,248,0.4);
  box-shadow: 0 12px 30px rgba(56,189,248,0.25);
}

/* active */
.number-grid button.active {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  box-shadow: 0 10px 35px rgba(59,130,246,0.4);
}

/* reserved */
.number-grid button.reserved {
  background: rgba(148,163,184,0.15);
  color: #94a3b8;
  text-decoration: line-through;
}

/* ================= BUTTON ================= */
.primary {
  margin-top: 10px;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  border-radius: 12px;

  transition: 0.25s;
}

.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 18px 45px rgba(59,130,246,0.35);
}

/* ================= BADGE ================= */
.pill {
  display: inline-block;

  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;

  padding: 4px 10px;
  border-radius: 999px;

  font-size: 0.7rem;
  font-weight: 700;
}

/* ================= ERROR ================= */
.field-error {
  color: #f87171;
  font-size: 0.85rem;
  margin-top: 10px;
}

/* ================= ANIMATION ================= */
.lottery-card,
.panel,
.number-grid button {
  animation: fadeInUp 0.4s ease both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .lottery-layout {
    grid-template-columns: 1fr;
  }

  .lottery-stack {
    flex-direction: row;
    overflow-x: auto;
  }

  .lottery-card {
    min-width: 220px;
  }

  .number-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 600px) {
  .number-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
