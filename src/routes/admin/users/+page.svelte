<script>
  import { onMount } from 'svelte';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { supabase } from '$lib/supabase';

  import { Shield, UserRound, Wallet } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';

  let users = [];
  let isAdmin = false;
  let loading = true;

  let totalUsers = 0;
  let blockedUsers = 0;
  let activeUsers = 0;

  // ---------------- INIT ----------------
  onMount(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        loading = false;
        return;
      }

      await checkAdmin(firebaseUser.uid);
    });
  });

  // ---------------- CHECK ADMIN ----------------
  async function checkAdmin(uid) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    if (!profile) {
      loading = false;
      return;
    }

    isAdmin = profile.role === 'admin' && profile.is_blocked === false;

    if (isAdmin) {
      await loadUsers();
    }

    loading = false;
  }

  // ---------------- LOAD USERS ----------------
  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    users = data || [];

    computeStats();
  }

  // ---------------- STATS ----------------
  function computeStats() {
    totalUsers = users.length;
    blockedUsers = users.filter(u => u.is_blocked).length;
    activeUsers = totalUsers - blockedUsers;
  }

  // ---------------- TOGGLE BLOCK ----------------
  async function toggleStatus(user) {
    const next = !user.is_blocked;

    await supabase
      .from('users')
      .update({ is_blocked: next })
      .eq('id', user.id);

    // update UI instantly
    user.is_blocked = next;
    computeStats();
  }
</script>

<AppShell>
  <span slot="title">User Management</span>

  {#if loading}
    <section class="access">
      <p>Loading...</p>
    </section>

  {:else if !isAdmin}

    <section class="access">
      <Shield size={42} />
      <h2>Admin Only Access</h2>
      <p>User control panel is restricted</p>
    </section>

  {:else}

    <!-- KPI -->
    <section class="kpi">
      <div class="card">
        <h3>{totalUsers}</h3>
        <p>Total Users</p>
      </div>

      <div class="card success">
        <h3>{activeUsers}</h3>
        <p>Active</p>
      </div>

      <div class="card danger">
        <h3>{blockedUsers}</h3>
        <p>Blocked</p>
      </div>
    </section>

    <!-- PANEL -->
    <section class="panel">

      <div class="header">
        <div>
          <p class="muted">Account management system</p>
          <h2>Registered Users</h2>
        </div>

        <UserRound size={20} />
      </div>

      <!-- USERS -->
      <div class="list">
        {#each users as user}

          <article class="user-card">

            <!-- LEFT -->
            <div class="left">

              <div class="name">
                <strong>{user.name}</strong>
                <span class="role">{user.role}</span>
              </div>

              <div class="meta">
                <span>📧 {user.email}</span>
                <span>📱 {user.phone}</span>
              </div>

              <div class="wallet">
                <Wallet size={14} />
                <span>₹{Number(user.wallet_balance || 0).toLocaleString()}</span>
              </div>

            </div>

            <!-- RIGHT -->
            <div class="right">

              <span class={"status " + (user.is_blocked ? 'blocked' : 'active')}>
                {user.is_blocked ? 'blocked' : 'active'}
              </span>

              <button class="btn" on:click={() => toggleStatus(user)}>
                {user.is_blocked ? 'Activate' : 'Block'}
              </button>

            </div>

          </article>

        {:else}
          <div class="empty">No users found</div>
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

  .card {
    background: white;
    border: 1px solid #eee;
    padding: 14px;
    border-radius: 12px;
    text-align: center;
  }

  .success { border-color: #22c55e; }
  .danger { border-color: #ef4444; }

  .panel {
    background: white;
    border: 1px solid #eee;
    border-radius: 14px;
    padding: 16px;
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
    gap: 10px;
  }

  .user-card {
    display: flex;
    justify-content: space-between;
    padding: 14px;
    border: 1px solid #eee;
    border-radius: 12px;
    transition: 0.2s;
  }

  .user-card:hover {
    box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .name {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .role {
    font-size: 11px;
    padding: 2px 8px;
    background: #f3f4f6;
    border-radius: 999px;
  }

  .meta {
    font-size: 12px;
    opacity: 0.8;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .wallet {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .status {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
  }

  .active { background: #dcfce7; }
  .blocked { background: #fee2e2; }

  .btn {
    background: black;
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
  }

  .empty {
    text-align: center;
    padding: 20px;
    opacity: 0.6;
  }

  .access {
    text-align: center;
    padding: 50px;
  }
</style>