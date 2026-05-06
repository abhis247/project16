<script>
  import { Crown, Shield } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { getAuth, onAuthStateChanged } from "firebase/auth";

  let profile = null;
  let winners = [];
  let loading = true;
  let user = null;

  // 🔥 reactive admin check (IMPORTANT FIX)
  $: isAdmin = profile?.role === 'admin';

  async function loadProfile(firebaseUser) {
    console.log("Firebase UID:", firebaseUser.uid);

    const { data: me, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .single();

    if (error) {
      console.error("PROFILE ERROR:", error);
      profile = null;
      return;
    }

    profile = me;
    console.log("PROFILE:", profile);
    console.log("ROLE:", profile?.role);
    console.log("IS ADMIN:", profile?.role === 'admin');
  }

  async function loadWinners() {
    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        title,
        prize,
        winning_number,
        created_at,
        winner:users(full_name, social_handle)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("WINNERS ERROR:", error);
    }

    winners = data || [];
  }

  onMount(() => {
    const auth = getAuth();

    // 🔥 WAIT for Firebase auth state properly
    onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        loading = false;
        return;
      }

      user = fbUser;

      await loadProfile(fbUser);

      if (profile?.role === 'admin') {
        await loadWinners();
      }

      loading = false;
    });
  });
</script>

<AppShell>
  <span slot="title">Winners</span>

  {#if loading}
    <section class="access">
      <p>Loading...</p>
    </section>

  {:else if !isAdmin}

    <section class="access">
      <Shield size={42} />
      <p class="eyebrow">Admin only</p>
      <h2>Winner management is hidden from players.</h2>
      <a href="/winners">Public winners</a>
    </section>

  {:else}

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Draw results</p>
          <h2>Winner records</h2>
        </div>
        <Crown size={28} />
      </div>

      <div class="admin-list">

        {#each winners as winner}
          <article>
            <div>
              <strong>{winner.winner?.full_name ?? 'Unknown'}</strong>
              <span>
                {winner.title} · #{winner.winning_number} · {winner.winner?.social_handle ?? ''}
              </span>
            </div>

            <span class="pill">
              {winner.prize}
            </span>
          </article>
        {:else}
          <p class="empty">No winner records yet.</p>
        {/each}

      </div>
    </section>

  {/if}
</AppShell>

<style>
  .access {
    text-align: center;
    padding: 50px;
  }

  .panel {
    background: white;
    border: 1px solid #eee;
    border-radius: 14px;
    padding: 16px;
  }

  .panel-heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .admin-list {
    display: grid;
    gap: 10px;
  }

  article {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #f1f1f1;
    border-radius: 10px;
  }

  .pill {
    background: #f3f4f6;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
  }

  .empty {
    text-align: center;
    opacity: 0.6;
    padding: 20px;
  }
</style>