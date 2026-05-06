<script>
  import { CreditCard, Shield, User, Check, X } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let payouts = [];
  let loading = false;
  let isAdmin = true;

  async function loadPayouts() {
    loading = true;

    const { data, error } = await supabase
      .from('payouts')
      .select(`
        id,
        amount,
        status,
        created_at,
        user_id,
        lottery_id,
        winner_id,
        users:user_id (name, social_handle),
        lotteries:lottery_id (name, prize),
        payout_details:user_id (bank_account, ifsc, account_name, upi_id)
      `)
      .order('created_at', { ascending: false });

    if (!error) payouts = data || [];

    loading = false;
  }

  onMount(loadPayouts);

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('payouts')
      .update({ status })
      .eq('id', id);

    if (!error) await loadPayouts();
  }

  $: total = payouts.length;
  $: pending = payouts.filter(p => p.status === 'pending').length;
  $: paid = payouts.filter(p => p.status === 'paid').length;
</script>

<AppShell>
  <span slot="title">Payout Dashboard</span>

  {#if !isAdmin}
    <section class="access">
      <Shield size={40} />
      <h2>Admin Only Access</h2>
    </section>
  {:else}

    <!-- KPI -->
    <section class="kpi">
      <div class="kpi-card">
        <h3>{total}</h3>
        <p>Total Requests</p>
      </div>

      <div class="kpi-card warn">
        <h3>{pending}</h3>
        <p>Pending</p>
      </div>

      <div class="kpi-card success">
        <h3>{paid}</h3>
        <p>Paid</p>
      </div>
    </section>

    <!-- PANEL -->
    <section class="panel">

      <div class="header">
        <div>
          <h2>Winner Payouts</h2>
          <p class="muted">Manage all withdrawals from winners</p>
        </div>
        <CreditCard />
      </div>

      {#if loading}
        <div class="loading">Loading payouts...</div>
      {/if}

      <div class="list">

        {#each payouts as p}

          <article class="card">

            <!-- LEFT -->
            <div class="left">

              <div class="user">
                <User size={16} />
                <strong>{p.users?.name}</strong>
                <span class="tag">@{p.users?.social_handle}</span>
              </div>

              <div class="meta">
                <span>🎯 {p.lotteries?.name}</span>
                <span>🏆 ₹{p.lotteries?.prize}</span>
                <span>💰 Payout: ₹{p.amount}</span>
              </div>

              {#if p.payout_details}
                <div class="bank">
                  <span>🏦 {p.payout_details.account_name}</span>
                  <span>IFSC: {p.payout_details.ifsc}</span>
                  <span>UPI: {p.payout_details.upi_id}</span>
                </div>
              {/if}

            </div>

            <!-- RIGHT -->
            <div class="right">

              <span class={"status " + p.status}>
                {p.status}
              </span>

              {#if p.status === 'pending'}
                <button class="btn success" on:click={() => updateStatus(p.id, 'paid')}>
                  <Check size={14} /> Approve
                </button>

                <button class="btn danger" on:click={() => updateStatus(p.id, 'failed')}>
                  <X size={14} /> Reject
                </button>
              {/if}

            </div>

          </article>

        {:else}
          <div class="empty">No payout requests found</div>
        {/each}

      </div>

    </section>

  {/if}
</AppShell>

<style>
  .kpi {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 14px;
  }

  .kpi-card {
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #eee;
    text-align: center;
  }

  .kpi-card h3 {
    margin: 0;
    font-size: 22px;
  }

  .success { border-color: #22c55e; }
  .warn { border-color: #f59e0b; }

  .panel {
    background: white;
    border-radius: 14px;
    padding: 16px;
    border: 1px solid #eee;
  }

  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .muted {
    font-size: 12px;
    opacity: 0.6;
  }

  .list {
    display: grid;
    gap: 12px;
  }

  .card {
    display: flex;
    justify-content: space-between;
    padding: 14px;
    border: 1px solid #eee;
    border-radius: 12px;
    background: #fff;
  }

  .card:hover {
    box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  }

  .user {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tag {
    font-size: 11px;
    opacity: 0.6;
  }

  .meta, .bank {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 12px;
    opacity: 0.8;
    margin-top: 6px;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .status {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
  }

  .paid { background: #dcfce7; }
  .pending { background: #fef3c7; }
  .failed { background: #fee2e2; }

  .btn {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 6px 10px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 12px;
  }

  .success {
    background: #22c55e;
    color: white;
  }

  .danger {
    background: #ef4444;
    color: white;
  }

  .empty {
    text-align: center;
    padding: 30px;
    opacity: 0.6;
  }

  .loading {
    padding: 20px;
    opacity: 0.7;
  }

  .access {
    text-align: center;
    padding: 50px;
  }
</style>