<script>
  import {
    ArrowUpRight,
    Crown,
    CreditCard,
    FileCheck2,
    Shield,
    Ticket,
    Trophy,
    UserRound,
    Wallet
  } from 'lucide-svelte';

  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  /* ================= ACTIONS ================= */
  const userActions = [
    { href: '/wallet', label: 'Top up wallet', subtitle: 'Deposit funds instantly', icon: Wallet },
    { href: '/lotteries', label: 'Join lottery', subtitle: 'Pick your lucky numbers', icon: Ticket },
    { href: '/winners', label: 'Winner notices', subtitle: 'Track recent payouts', icon: Crown },
    { href: '/account', label: 'Profile settings', subtitle: 'Update your account', icon: Shield }
  ];

  const adminActions = [
    { href: '/admin/users', label: 'Manage users', subtitle: 'Review accounts and roles', icon: UserRound },
    { href: '/admin/lotteries', label: 'Edit lotteries', subtitle: 'Launch or close draws', icon: Ticket },
    { href: '/admin/payouts', label: 'Approve payouts', subtitle: 'Mark winner payments', icon: CreditCard },
    { href: '/admin/settings', label: 'System settings', subtitle: 'Configure platform rules', icon: Shield }
  ];

  /* ================= STATE ================= */
  let user = null;
  let isAdmin = false;

  let wallets = [];
  let entries = [];
  let winners = [];
  let lotteries = [];
  let numbers = [];

  let metrics = {
    totalWalletBalance: 0,
    totalPlays: 0,
    openLotteries: 0
  };

  /* ================= LOAD DATABASE ================= */
  async function loadData() {
    // AUTH USER
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;

    // PROFILE
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    user = profile;
    isAdmin = profile?.role === 'admin';

    // ENTRIES
    const { data: entryData } = await supabase
      .from('entries')
      .select('*, lotteries(*)')
      .eq('user_id', profile?.id);

    entries = entryData || [];

    // WINNERS
    const { data: winData } = await supabase
      .from('winners')
      .select('*, users(*), lotteries(*)');

    winners = winData || [];

    // LOTTERIES
    const { data: lotData } = await supabase
      .from('lotteries')
      .select('*');

    lotteries = lotData || [];

    // NUMBERS
    const { data: numData } = await supabase
      .from('lottery_numbers')
      .select('*');

    numbers = numData || [];

    // WALLETS
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance');

    wallets = walletData || [];

    /* ================= METRICS ================= */
    metrics = {
      totalWalletBalance:
        wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0),

      totalPlays: entryData?.length || 0,

      openLotteries:
        lotteries.filter(l => l.status === 'active').length
    };
  }

  onMount(loadData);

  /* ================= DERIVED ================= */
  $: actionCards = isAdmin ? adminActions : userActions;

  $: winningEntries =
    entries.filter(e => e?.lottery?.winner_profile_id === user?.id);

  $: topLotteries = lotteries
    .map(l => ({
      ...l,
      reserved: numbers.filter(
        n => n.lottery_id === l.id && n.status === 'reserved'
      ).length
    }))
    .sort((a, b) => b.reserved - a.reserved)
    .slice(0, 6);
</script>

<AppShell>
  <span slot="title">{isAdmin ? 'Admin Dashboard' : 'User Dashboard'}</span>

  <!-- HERO -->
  <section class="overview-grid">
    <article class="hero-panel">
      <div>
        <p class="eyebrow">
          {isAdmin ? 'Admin operations' : 'Player command center'}
        </p>

        <h2>
          {isAdmin
            ? 'Monitor users, wallet growth, lottery plays, winner notices, and manual payouts.'
            : 'Fund your wallet, enter lotteries, and track winnings.'}
        </h2>
      </div>

      <a class="primary" href={isAdmin ? '/admin' : '/lotteries'}>
        {#if isAdmin}
          <Shield size={18} /> Open admin
        {:else}
          <Ticket size={18} /> Enter lottery
        {/if}
      </a>
    </article>

    <article class="balance-card">
      <Wallet size={26} />
      <span>{isAdmin ? 'Platform wallets' : 'Wallet balance'}</span>

      <strong>
        ${Number(isAdmin ? metrics.totalWalletBalance : (user?.wallet_balance ?? 0)).toLocaleString()}
      </strong>
    </article>
  </section>

  <!-- METRICS -->
  <section class="metrics">
    {#if isAdmin}
      <article><Wallet size={24} /><span>Total wallets</span><strong>${metrics.totalWalletBalance}</strong></article>
      <article><Ticket size={24} /><span>Total plays</span><strong>{metrics.totalPlays}</strong></article>
      <article><Trophy size={24} /><span>Open lotteries</span><strong>{metrics.openLotteries}</strong></article>
      <article><Crown size={24} /><span>Winners</span><strong>{winners.length}</strong></article>
    {:else}
      <article><Wallet size={24} /><span>Balance</span><strong>${Number(user?.wallet_balance ?? 0)}</strong></article>
      <article><FileCheck2 size={24} /><span>Your entries</span><strong>{entries.length}</strong></article>
      <article><Trophy size={24} /><span>Open lotteries</span><strong>{metrics.openLotteries}</strong></article>
      <article><Crown size={24} /><span>Your wins</span><strong>{winningEntries.length}</strong></article>
    {/if}
  </section>

  <!-- ACTIONS -->
  <section class="dashboard-card-grid">
    {#each actionCards as action}
      <a class="action-card" href={action.href}>
        <div class="action-icon">
          <svelte:component this={action.icon} size={22} />
        </div>
        <div>
          <strong>{action.label}</strong>
          <span>{action.subtitle}</span>
        </div>
      </a>
    {/each}
  </section>

  <!-- HOT LOTTERIES -->
  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Hot lotteries</p>
        <h2>Trending draws</h2>
      </div>
      <ArrowUpRight size={24} />
    </div>

    <div class="entry-list">
      {#each topLotteries as lottery}
        <article>
          <div>
            <strong>{lottery.title}</strong>
            <span>{lottery.reserved} reserved · {lottery.status}</span>
          </div>

          <a class="ghost" href={isAdmin ? '/admin/lotteries' : `/lotteries/${lottery.id}`}>
            View
          </a>
        </article>
      {/each}
    </div>
  </section>

  <!-- TIMELINE + WINNERS -->
  <section class="grid two">

    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">
            {isAdmin ? 'Recent plays' : 'Your active plays'}
          </p>
          <h2>Entry timeline</h2>
        </div>
        <ArrowUpRight size={24} />
      </div>

      <div class="entry-list">
        {#each (isAdmin ? numbers.filter(n => n.status === 'reserved') : entries).slice(0, 6) as entry}
          {@const lottery = lotteries.find(l => l.id === entry.lottery_id)}

          <article>
            <div>
              <strong>{entry.number}</strong>
              <span>
                {lottery?.title} · {isAdmin ? entry.user_id : lottery?.status}
              </span>
            </div>

            <span class="pill">
              {lottery?.winning_number === entry.number ? 'Winner' : 'Awaiting notice'}
            </span>
          </article>
        {:else}
          <p class="empty">No entries yet.</p>
        {/each}
      </div>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Latest winners</p>
          <h2>Public notices</h2>
        </div>
        <Crown size={24} />
      </div>

      <div class="entry-list">
        {#each winners.slice(0, 4) as winner}
          <article>
            <div>
              <strong>{winner.users?.full_name}</strong>
              <span>{winner.lotteries?.title} · {winner.winning_number}</span>
            </div>
            <span class="pill">{winner.users?.instagram}</span>
          </article>
        {:else}
          <p class="empty">No winners announced yet.</p>
        {/each}
      </div>
    </div>

  </section>
</AppShell>
<style>
  /* ================= GLOBAL DASHBOARD BACKGROUND ================= */
:global(body) {
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

/* ================= PAGE ANIMATION ================= */
.overview-grid,
.metrics,
.dashboard-card-grid,
.panel {
  animation: fadeInUp 0.5s ease both;
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

/* ================= HERO PANEL ================= */
.hero-panel {
  border-radius: 22px;
  padding: 30px;

  background:
    linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.7)),
    radial-gradient(circle at top right, rgba(56,189,248,0.25), transparent);

  color: white;
  border: 1px solid rgba(255,255,255,0.08);

  transition: 0.3s;
}

.hero-panel:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 80px rgba(37,99,235,0.3);
}

/* ================= BALANCE CARD ================= */
.balance-card {
  border-radius: 22px;
  padding: 24px;

  background: rgba(15,23,42,0.85);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);

  transition: 0.3s;
}

.balance-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
}

/* ================= METRICS ================= */
.metrics article {
  border-radius: 18px;
  padding: 18px;

  background: rgba(30,41,59,0.85);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  transition: 0.3s;
}

.metrics article:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

/* ================= ACTION CARDS ================= */
.action-card {
  border-radius: 20px;
  padding: 18px;

  background: rgba(30,41,59,0.9);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  transition: 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
  border-color: rgba(56,189,248,0.4);
}

/* icon glow */
.action-icon {
  border-radius: 14px;
  background: rgba(56,189,248,0.15);
  color: #38bdf8;
}

/* ================= PANELS ================= */
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

/* ================= LIST ITEMS ================= */
.entry-list article {
  border-radius: 14px;
  padding: 14px;

  background: rgba(15,23,42,0.7);
  color: white;

  border: 1px solid rgba(255,255,255,0.06);

  transition: 0.2s;
}

.entry-list article:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}

/* ================= TEXT COLORS FIX ================= */
.entry-list span,
.panel span,
.metrics span {
  color: #94a3b8;
}

/* ================= BADGE ================= */
.pill {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
}

/* ================= BUTTON ================= */
.primary {
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
}

.primary:hover {
  transform: translateY(-2px) scale(1.05);
}

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .overview-grid,
  .grid.two {
    grid-template-columns: 1fr;
  }

  .dashboard-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .dashboard-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>