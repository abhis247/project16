```svelte
<script>
  import { Plus, Wallet } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let fundAmount = 100;
  let error = '';

  let wallet = { balance: 0 };
  let transactions = [];

  let user_id = localStorage.getItem('user_id'); // ⚠️ replace with auth later

  function clearError() {
    error = '';
  }

  // ================= LOAD WALLET =================
  async function loadWallet() {
    if (!user_id) return;

    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    wallet = data || { balance: 0 };
  }

  // ================= LOAD TRANSACTIONS =================
  async function loadTransactions() {
    if (!user_id) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    transactions = data || [];
  }

  // ================= ADD MONEY =================
  async function fundWallet() {
    const amount = Number(fundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      error = 'Enter an amount above 0.';
      return;
    }

    // 1️⃣ Create Razorpay order
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const order = await res.json();

    if (!window.Razorpay) {
      alert('Payment system not loaded');
      return;
    }

    // 2️⃣ Open Razorpay
    const options = {
      key: 'rzp_test_Sla0LfPGKGA4o6', // your key_id
      amount: order.amount,
      currency: 'INR',
      name: 'LotteryPro',
      description: 'Add Money',
      order_id: order.id,

      handler: async function (response) {
        // 3️⃣ Verify payment
        await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            user_id,
            amount
          })
        });

        // 4️⃣ Refresh UI
        await loadWallet();
        await loadTransactions();
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  onMount(() => {
    loadWallet();
    loadTransactions();
  });
</script>

<AppShell>
  <span slot="title">Wallet</span>

  <section class="grid two">

    <!-- WALLET -->
    <div class="panel wallet-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Available balance</p>
          <h2>₹{Number(wallet.balance).toLocaleString()}</h2>
        </div>
        <Wallet size={30} />
      </div>

      <!-- INPUT -->
      <div class="inline-form">
        <label class="field">
          <input
            class:error={!!error}
            bind:value={fundAmount}
            type="number"
            min="1"
            on:input={clearError}
          />
          {#if error}
            <span class="field-error">{error}</span>
          {/if}
        </label>

        <button class="primary" on:click={fundWallet}>
          <Plus size={18} /> Add Money
        </button>
      </div>

      <!-- QUICK AMOUNTS -->
      <div class="quick">
        {#each [100, 500, 1000, 2000] as amt}
          <button on:click={() => fundAmount = amt}>
            ₹{amt}
          </button>
        {/each}
      </div>
    </div>

    <!-- TRANSACTIONS -->
    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Ledger</p>
          <h2>Wallet activity</h2>
        </div>
      </div>

      <div class="mini-list">
        {#each transactions as t}
          <div>
            <span>{t.source}</span>
            <strong>
              {t.type === 'credit' ? '+' : '-'}
              ₹{Number(t.amount).toLocaleString()}
            </strong>
          </div>
        {:else}
          <p class="empty">No wallet activity yet.</p>
        {/each}
      </div>
    </div>

  </section>
</AppShell>

<style>
/* layout */
.grid.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* panel */
.panel {
  border-radius: 20px;
  padding: 20px;
  background: rgba(30,41,59,0.9);
  color: white;
  border: 1px solid rgba(255,255,255,0.08);
}

/* heading */
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* input */
.field {
  display: grid;
  gap: 6px;
}

input {
  padding: 10px;
  border-radius: 8px;
  background: rgba(15,23,42,0.8);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
}

/* error */
.field-error {
  color: #f87171;
  font-size: 0.8rem;
}

/* button */
.primary {
  padding: 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
}
.quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.quick button {
  padding: 10px 0;
  border-radius: 10px;

  background: rgba(255,255,255,0.08);
  color: white;

  font-weight: 600;

  border: 1px solid rgba(255,255,255,0.1);

  transition: 0.25s;
}

/* hover */
.quick button:hover {
  background: rgba(59,130,246,0.2);
  transform: translateY(-2px);
}

/* selected */
.quick button.active {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  border: none;
}
/* list */
.mini-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.empty {
  color: #94a3b8;
}

/* responsive */
@media (max-width: 900px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
```
