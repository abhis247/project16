<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto, preloadCode } from '$app/navigation';

  import {
    Bell, Crown, CreditCard, Database, FileCheck2,
    LayoutDashboard, Shield, Ticket, UserRound, Wallet
  } from 'lucide-svelte';

  import { firebaseApp, firebaseConfigured } from '$lib/firebase';
  import { supabase, supabaseConfigured } from '$lib/supabase';

  let menuOpen = false;
  let user = null;
  let loading = true;

  let visibleLinks = [];

  // ---------------- AUTH ----------------
  onMount(async () => {
    const { getAuth, onAuthStateChanged } = await import('firebase/auth');
    const auth = getAuth(firebaseApp);

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        user = null;
        loading = false;
        return;
      }

      // Fetch from Supabase
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      user = data || {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        role: 'user'
      };

      loading = false;

      // preload links
      visibleLinks.forEach((l) => preloadCode(l.href).catch(() => {}));
    });
  });

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  async function handleLogout() {
    closeMenu();

    const { getAuth, signOut } = await import('firebase/auth');
    const auth = getAuth(firebaseApp);

    await signOut(auth);

    user = null;
    goto('/');
  }

  // ---------------- LINKS ----------------
  $: links =
    user?.role === 'admin'
      ? [
          { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/users', label: 'Users', icon: UserRound },
          { href: '/admin/lotteries', label: 'Lotteries', icon: Ticket },
          { href: '/admin/wallet', label: 'Wallet', icon: Wallet },
          { href: '/admin/payouts', label: 'Payouts', icon: CreditCard },
          { href: '/admin/winners', label: 'Winners', icon: Crown },
          { href: '/admin/settings', label: 'Settings', icon: Shield }
        ]
      : [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/lotteries', label: 'Lotteries', icon: Ticket },
          { href: '/entries', label: 'Entries', icon: FileCheck2 },
          { href: '/wallet', label: 'Wallet', icon: Wallet },
          { href: '/payout', label: 'Payout', icon: CreditCard },
          { href: '/winners', label: 'Winners', icon: Crown },
          { href: '/notifications', label: 'Notices', icon: Bell },
          { href: '/account', label: 'Account', icon: UserRound }
        ];

  $: visibleLinks = links;
</script>

<div class="app-frame">
  <!-- SIDEBAR -->
  <aside class="sidebar">
    <a class="brand" href="/">
      <span>LP</span>
      <strong>LotteryPro</strong>
    </a>

    <nav aria-label="Primary">
      {#each visibleLinks as link}
        <a class:active={$page.url.pathname === link.href} href={link.href}>
          <svelte:component this={link.icon} size={18} />
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="connection-card">
      <span class:ready={firebaseConfigured}>
        <Shield size={15}/> Firebase {firebaseConfigured ? 'live' : 'demo'}
      </span>
      <span class:ready={supabaseConfigured}>
        <Database size={15}/> Supabase {supabaseConfigured ? 'live' : 'demo'}
      </span>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="workspace">
    <header class="appbar">
      <div class="appbar-brand">
        <a class="appbar-link" href="/">LotteryPro</a>
        <span class="appbar-chip">Live</span>
      </div>

      <nav class="appbar-nav">
        {#each visibleLinks as link}
          <a class:active={$page.url.pathname === link.href} href={link.href}>
            <svelte:component this={link.icon} size={16} />
            <span>{link.label}</span>
          </a>
        {/each}
      </nav>

      <div class="appbar-actions">
        <button class="icon-button">
          <Bell size={18}/>
        </button>

        <div class="account-menu">
          <button class="icon-button" on:click={toggleMenu}>
            <UserRound size={18}/>
          </button>

          {#if menuOpen}
            <div class="account-popup">
              <div class="account-popup-info">
                <strong>{user?.name ?? 'Guest'}</strong>
                <small>{user?.email ?? 'No email'}</small>
              </div>

              <button class="logout-button" on:click={handleLogout}>
                Logout
              </button>
            </div>
          {/if}
        </div>
      </div>
    </header>

    {#if loading}
      <div class="notice"><Bell size={18}/> Loading...</div>
    {/if}

    <slot />

    <!-- MOBILE NAV -->
    <nav class="mobile-nav">
      {#each visibleLinks as link}
        <a class:active={$page.url.pathname === link.href} href={link.href}>
          <svelte:component this={link.icon} size={18}/>
          <span>{link.label}</span>
        </a>
      {/each}
    </nav>
  </div>
</div>

<svelte:window on:click={(e) => {
  if (!e.target.closest('.account-menu')) closeMenu();
}}/>

<style>
  .appbar-actions {
    display:flex;
    gap:0.8rem;
  }

  .account-popup {
    position:absolute;
    right:0;
    background:white;
    border-radius:14px;
    padding:1rem;
  }

  .logout-button {
    width:100%;
    margin-top:10px;
  }

  @media (min-width:981px) {
    .appbar-nav { display:none; }
  }


  .account-popup {
  position: absolute;
  right: 0;
  top: calc(100% + 0.6rem);
  min-width: 240px;
  max-width: 280px;

  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);

  padding: 12px;
  z-index: 9999; /* FIX: ensures it stays above everything */
  backdrop-filter: blur(14px);

  overflow: hidden;
}
.account-popup-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
  word-break: break-word;
}

.account-popup-info strong {
  font-size: 14px;
  color: #0f172a;
  line-height: 1.3;
}

.account-popup-info small {
  font-size: 12px;
  color: #475569;
  word-break: break-all;
}
</style>