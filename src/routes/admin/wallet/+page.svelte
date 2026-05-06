<script>
  import { Shield, TrendingUp, Wallet } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { getAuth } from "firebase/auth";

  let profile = null;
  let transactions = [];
  let loading = true;
  let isAdmin = false;

  let metrics = {
    totalWalletBalance: 0,
    dailyIncrease: 0
  };

  // ---------------- LOAD DATA ----------------
  async function loadData() {
    loading = true;

    // 🔥 Firebase Auth (IMPORTANT)
    const auth = getAuth();
    const user = auth.currentUser;

    console.log("AUTH USER:", user);

    if (!user) {
      loading = false;
      return;
    }

    // 🔥 Get profile from Supabase using Firebase UID
    const { data: me, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', user.uid)
      .single();

    if (error) {
      console.error("PROFILE ERROR:", error);
      loading = false;
      return;
    }

    profile = me;
    isAdmin = profile?.role === 'admin';

    console.log("PROFILE:", profile);
    console.log("IS ADMIN:", isAdmin);

    // ❌ Stop if not admin
    if (!isAdmin) {
      loading = false;
      return;
    }

    // ---------------- WALLET BALANCE ----------------
    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance');

    const totalWalletBalance =
      wallets?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0;

    // ---------------- TRANSACTIONS ----------------
    const { data: txns, error: txnErr } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txnErr) {
      console.error("TRANSACTION ERROR:", txnErr);
    }

    transactions = txns || [];

    // ---------------- DAILY INCOME ----------------
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyIncrease = transactions
      .filter(t => new Date(t.created_at) >= today && t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    metrics = {
      totalWalletBalance,
      dailyIncrease
    };

    loading = false;
  }

  onMount(loadData);

  // ---------------- HELPERS ----------------
  $: fundingCount = transactions.filter(t => t.type === 'credit').length;
  $: playCount = transactions.filter(t => t.type === 'debit').length;

  function amountClass(amount) {
    return Number(amount) >= 0 ? 'credit' : 'debit';
  }
</script>

<AppShell>
  <span slot="title">Wallet Analytics</span>

  <!-- LOADING -->
  {#if loading}
    <section class="access">
      <p>Loading...</p>
    </section>

  <!-- NOT ADMIN -->
  {:else if !isAdmin}
    <section class="access">
      <Shield size={44} />
      <h2>Admin only</h2>
      <p>Wallet analytics are restricted</p>
      <a href="/dashboard">Return</a>
    </section>

  <!-- ADMIN DASHBOARD -->
  {:else}

    <!-- KPI CARDS -->
    <section class="metrics">

      <article>
        <Wallet size={22} />
        <span>Total Wallet</span>
        <strong>₹{metrics.totalWalletBalance.toLocaleString()}</strong>
      </article>

      <article>
        <TrendingUp size={22} />
        <span>Today Income</span>
        <strong>₹{metrics.dailyIncrease.toLocaleString()}</strong>
      </article>

      <article>
        <Wallet size={22} />
        <span>Funding</span>
        <strong>{fundingCount}</strong>
      </article>

      <article>
        <Wallet size={22} />
        <span>Play Debits</span>
        <strong>{playCount}</strong>
      </article>

    </section>

    <!-- TRANSACTIONS LIST -->
    <section class="panel">

      <div class="header">
        <div>
          <p class="muted">Live Supabase Ledger</p>
          <h2>Transactions</h2>
        </div>
      </div>

      <div class="list">

        {#each transactions as txn}
          <article class="row">

            <div>
              <strong>User #{txn.user_id?.slice(0, 6) ?? 'unknown'}</strong>
              <span>{txn.description ?? txn.source ?? 'No description'}</span>
            </div>

            <div class={"amount " + amountClass(txn.amount)}>
              {txn.amount > 0 ? '+' : ''}₹{Number(txn.amount).toLocaleString()}
            </div>

          </article>
        {/each}

      </div>

    </section>

  {/if}
</AppShell>

<style>
  .metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 14px;
  }

  .metrics article {
    background: white;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid #eee;
  }

  .metrics span {
    display: block;
    font-size: 12px;
    opacity: 0.6;
  }

  .metrics strong {
    font-size: 18px;
  }

  .panel {
    background: white;
    border: 1px solid #eee;
    border-radius: 14px;
    padding: 16px;
  }

  .header {
    margin-bottom: 12px;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #f1f1f1;
    border-radius: 10px;
  }

  .amount {
    font-weight: 600;
  }

  .credit { color: #16a34a; }
  .debit { color: #dc2626; }

  .access {
    text-align: center;
    padding: 50px;
  }

  .access a {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 12px;
    background: black;
    color: white;
    border-radius: 8px;
  }
</style>