<script>
  import { onMount } from 'svelte';
  import {
    RotateCcw,
    Shield,
    Database,
    KeyRound,
    CreditCard,
    RefreshCw
  } from 'lucide-svelte';

  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { firebaseApp } from '$lib/firebase';

  let isAdmin = false;
  let loading = true;

  let stats = {
    users: 0,
    lotteries: 0,
    payouts: 0,
    pendingPayouts: 0
  };

  // ---------------- AUTH + ADMIN CHECK ----------------
  onMount(() => {
    const auth = getAuth(firebaseApp);

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        isAdmin = false;
        loading = false;
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', user.uid)
        .single();

      isAdmin = profile?.role === 'admin' && !profile?.is_blocked;

      if (isAdmin) {
        await loadStats();
      }

      loading = false;
    });
  });

  // ---------------- LOAD STATS ----------------
  async function loadStats() {
    try {
      const [{ count: u }, { count: l }, { count: p }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('lotteries').select('*', { count: 'exact', head: true }),
        supabase.from('payouts').select('*', { count: 'exact', head: true })
      ]);

      const { count: pending } = await supabase
        .from('payouts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      stats = {
        users: u || 0,
        lotteries: l || 0,
        payouts: p || 0,
        pendingPayouts: pending || 0
      };

    } catch (err) {
      console.error('Stats load error:', err);
    }
  }
</script>

<AppShell>
  <span slot="title">System Settings</span>

  {#if !isAdmin}

    <section class="access">
      <Shield size={44} />
      <h2>Admin Only</h2>
      <p>System configuration is restricted</p>
    </section>

  {:else}

    <!-- SYSTEM STATS -->
    <section class="grid">

      <div class="card">
        <Database size={18} />
        <h3>{stats.users}</h3>
        <p>Users</p>
      </div>

      <div class="card">
        <Shield size={18} />
        <h3>{stats.lotteries}</h3>
        <p>Lotteries</p>
      </div>

      <div class="card">
        <CreditCard size={18} />
        <h3>{stats.payouts}</h3>
        <p>Total Payouts</p>
      </div>

      <div class="card warn">
        <KeyRound size={18} />
        <h3>{stats.pendingPayouts}</h3>
        <p>Pending Payouts</p>
      </div>

    </section>

    <!-- CONFIG PANEL -->
    <section class="panel">

      <div class="header">
        <div>
          <p class="muted">System configuration</p>
          <h2>Live Platform Settings</h2>
        </div>

        <Shield size={20} />
      </div>

      <div class="settings">

        <div class="setting">
          <strong>Firebase Authentication</strong>
          <p>Configured via environment variables</p>
          <span class="tag success">Active</span>
        </div>

        <div class="setting">
          <strong>Supabase Database</strong>
          <p>Real-time data sync enabled</p>
          <span class="tag success">Connected</span>
        </div>

        <div class="setting">
          <strong>Payout System</strong>
          <p>Manual admin approval required</p>
          <span class="tag warn">Manual Mode</span>
        </div>

      </div>

      <!-- ACTIONS -->
      <div class="actions">

        <button class="primary" on:click={loadStats}>
          <RefreshCw size={16} /> Refresh Stats
        </button>

        <button class="ghost" on:click={() => platform.reset()}>
          <RotateCcw size={16} /> Reset Session
        </button>

      </div>

    </section>

  {/if}
</AppShell>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .card {
    background: white;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid #eee;
    text-align: center;
  }

  .card h3 {
    margin: 6px 0;
    font-size: 20px;
  }

  .warn {
    border-color: #f59e0b;
  }

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

  .settings {
    display: grid;
    gap: 10px;
  }

  .setting {
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 10px;
  }

  .setting p {
    font-size: 12px;
    opacity: 0.7;
    margin: 4px 0;
  }

  .tag {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 999px;
  }

  .success { background: #dcfce7; }
  .warn { background: #fef3c7; }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
  }

  .primary {
    background: black;
    color: white;
    padding: 10px;
    border-radius: 8px;
    border: none;
  }

  .ghost {
    background: transparent;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 8px;
  }

  .access {
    text-align: center;
    padding: 50px;
  }
</style>