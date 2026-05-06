<script>
  import { onMount } from 'svelte';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { supabase } from '$lib/supabase';
  import AppShell from '$lib/components/AppShell.svelte';

  import {
    CreditCard,
    Plus,
    Shield,
    Ticket,
    Trophy,
    UserRound,
    Wallet
  } from 'lucide-svelte';

  let auth = null;

  let isAdmin = false;
  let loading = true;

  let users = [];
  let lotteries = [];
  let payouts = [];
  let numbers = [];
  let transactions = [];

  let metrics = {
    totalWalletBalance: 0,
    dailyIncrease: 0,
    totalPlays: 0,
    pendingPayouts: 0
  };

  // ---------------- AUTH LISTENER ----------------
  onMount(() => {
    auth = getAuth();

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        isAdmin = false;
        loading = false;
        return;
      }

      await loadUser(firebaseUser);
    });
  });

  // ---------------- LOAD USER ----------------
  async function loadUser(firebaseUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .single();

    if (!profile) {
      isAdmin = false;
      loading = false;
      return;
    }

    isAdmin = profile.role === 'admin' && profile.is_blocked === false;

    if (!isAdmin) {
      loading = false;
      return;
    }

    await fetchAllData();
  }

  // ---------------- FETCH ALL DATA ----------------
  async function fetchAllData() {
    const [
      usersRes,
      lotteriesRes,
      payoutsRes,
      numbersRes,
      txnsRes
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('lotteries').select('*'),
      supabase.from('payouts').select('*'),
      supabase.from('lottery_numbers').select('*'),
      supabase.from('transactions').select('*')
    ]);

    users = usersRes.data || [];
    lotteries = lotteriesRes.data || [];
    payouts = payoutsRes.data || [];
    numbers = numbersRes.data || [];
    transactions = txnsRes.data || [];

    computeMetrics();
    loading = false;
  }

  // ---------------- METRICS ----------------
  function computeMetrics() {
    const txns = transactions;

    const credits = txns
      .filter(t => t.type === 'credit')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const debits = txns
      .filter(t => t.type === 'debit')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    metrics.totalWalletBalance = credits - debits;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    metrics.dailyIncrease = txns
      .filter(t => new Date(t.created_at) >= today && t.type === 'credit')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    metrics.totalPlays = numbers.length;

    metrics.pendingPayouts = payouts.filter(
      p => (p.status || '').toLowerCase() === 'pending'
    ).length;
  }

// ---------------- DRAW FUNCTION ----------------
async function handleDraw(lottery) {
  const lotteryNumbers = numbers.filter(
    n => n.lottery_id === lottery.id
  );

  if (!lotteryNumbers.length) {
    alert('No participants');
    return;
  }

  const winner =
    lotteryNumbers[Math.floor(Math.random() * lotteryNumbers.length)];

  // insert payout
  await supabase.from('payouts').insert({
    user_id: winner.user_id,
    lottery_id: lottery.id,
    amount: lottery.prize || 0,
    status: 'pending'
  });

  // update lottery
  await supabase
    .from('lotteries')
    .update({ status: 'completed' })
    .eq('id', lottery.id);

  alert('Winner selected 🎉');

  await fetchAllData();
}
</script>

<AppShell>
  <span slot="title">Admin Dashboard</span>

  {#if loading}
    <section class="access-panel">
      <p>Loading dashboard...</p>
    </section>

  {:else if !isAdmin}
    <section class="access-panel">
      <Shield size={42} />
      <h2>Admin Only Access</h2>
      <p>You are not authorized to view this page.</p>
      <a class="primary" href="/dashboard">Go Back</a>
    </section>

  {:else}

    <!-- NAV -->
    <section class="subnav">
      <a href="/admin/users">Users</a>
      <a href="/admin/lotteries">Lotteries</a>
      <a href="/admin/wallet">Wallet</a>
      <a href="/admin/winners">Winners</a>
      <a href="/admin/payouts">Payouts</a>
    </section>

    <!-- METRICS -->
    <section class="metrics">
      <article>
        <Wallet size={22} />
        <span>Wallet</span>
        <strong>₹{metrics.totalWalletBalance.toLocaleString()}</strong>
      </article>

      <article>
        <Plus size={22} />
        <span>Today Gain</span>
        <strong>₹{metrics.dailyIncrease.toLocaleString()}</strong>
      </article>

      <article>
        <Ticket size={22} />
        <span>Total Plays</span>
        <strong>{metrics.totalPlays}</strong>
      </article>

      <article>
        <CreditCard size={22} />
        <span>Pending Payouts</span>
        <strong>{metrics.pendingPayouts}</strong>
      </article>
    </section>

    <section class="panel">
  <h2>Lotteries</h2>

  <div class="admin-list">
    {#each lotteries as lottery}

      {@const playsList = numbers.filter(n => n.lottery_id === lottery.id)}
      {@const plays = playsList.length}
      {@const usersCount = new Set(playsList.map(p => p.user_id)).size}

      <article>
        <div>
          <strong>{lottery.name}</strong>

          <span>
            🎟 {plays} plays · 👤 {usersCount} users
          </span>

          <span>
            💰 Prize: ₹{lottery.prize || 0}
          </span>

          <span>
            📅 {new Date(lottery.created_at).toLocaleDateString()}
          </span>

          <span>
            Status: {lottery.status}
          </span>
        </div>

        {#if lottery.status !== 'completed'}
          <button
            class="ghost"
            on:click={() => handleDraw(lottery)}
          >
            Draw
          </button>
        {:else}
          <span class="pill">Completed</span>
        {/if}
      </article>

    {/each}
  </div>
</section>
    <!-- USERS -->
    <section class="panel">
      <h2>Users</h2>

      <div class="admin-list">
        {#each users as user}
          <article>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

            <span class="pill">{user.role}</span>
          </article>
        {/each}
      </div>
    </section>

    <!-- PAYOUTS -->
    <section class="panel">
      <h2>Payouts</h2>

      <div class="admin-list">
        {#each payouts as payout}
          <article>
            <div>
              <strong>{payout.bank_name}</strong>
              <span>{payout.account_number}</span>
            </div>

            <span class="pill">{payout.status}</span>
          </article>
        {/each}
      </div>
    </section>

  {/if}
</AppShell>
<style>

/* -------- GLOBAL -------- */
section {
  margin-bottom: 24px;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: #0f172a;
}

.access-panel {
  text-align: center;
  padding: 40px 20px;
}

.access-panel h2 {
  margin: 10px 0;
}

/* -------- SUB NAV -------- */
.subnav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.subnav a {
  padding: 8px 14px;
  border-radius: 10px;
  background: #f1f5f9;
  text-decoration: none;
  color: #0f172a;
  font-size: 0.9rem;
  transition: 0.2s;
}

.subnav a:hover {
  background: #e2e8f0;
}

/* -------- METRICS -------- */
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metrics article {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metrics span {
  font-size: 0.85rem;
  color: #64748b;
}

.metrics strong {
  font-size: 1.3rem;
  color: #0f172a;
}

/* -------- PANELS -------- */
.panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

/* -------- LIST -------- */
.admin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-list article {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 12px;
  transition: 0.2s;
}

.admin-list article:hover {
  background: #f1f5f9;
}

.admin-list strong {
  display: block;
  font-size: 0.95rem;
  color: #0f172a;
}

.admin-list span {
  font-size: 0.8rem;
  color: #64748b;
}

/* -------- BADGE -------- */
.pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #e2e8f0;
  color: #0f172a;
}

/* -------- BUTTON -------- */
button.ghost {
  border: none;
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

button.ghost:hover {
  background: #bae6fd;
}

/* -------- MOBILE -------- */
@media (max-width: 768px) {
  .metrics {
    grid-template-columns: 1fr 1fr;
  }

  .admin-list article {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .subnav {
    overflow-x: auto;
  }
}
</style>