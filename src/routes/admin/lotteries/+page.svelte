<script>
  import {
    Plus,
    Shield,
    Activity,
    Wallet,
    Users,
    Sparkles,
    ChevronLeft,
    ChevronRight
  } from 'lucide-svelte';

  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let lotteries = [];
  let numbers = [];
  let numberMap = {};

  let loading = false;
  let creating = false;

  let page = 0;
  let pageSize = 6;
  let total = 0;

  let isAdmin = true;

  let form = {
    title: '',
    prize: 0,
    ticket_price: 0,
    draw_date: '',
    pool_size: 1000
  };

  /* -----------------------------
     RANDOM PAIR GENERATOR
  ------------------------------*/
  function generatePair() {
    const a = Math.floor(Math.random() * 90 + 10);
    const b = Math.floor(Math.random() * 90 + 10);
    return `${a}${b}`;
  }

  /* -----------------------------
     CACHE MAP (FAST STATS)
  ------------------------------*/
  $: {
    numberMap = {};
    for (const n of numbers) {
      if (!numberMap[n.lottery_id]) {
        numberMap[n.lottery_id] = [];
      }
      numberMap[n.lottery_id].push(n);
    }
  }

  function stats(id) {
    return numberMap[id] || [];
  }

  function plays(id) {
    return stats(id).filter(n => n.status === 'reserved').length;
  }

  function available(id) {
    return stats(id).filter(n => n.status === 'available').length;
  }

  /* -----------------------------
     CREATE NUMBER POOL (RANDOM PAIRS)
  ------------------------------*/
  async function createNumberPool(lottery_id, count = 1000) {
    const used = new Set();
    const rows = [];

    while (rows.length < count) {
      const number = generatePair();

      if (used.has(number)) continue;
      used.add(number);

      rows.push({
        lottery_id,
        number,
        status: 'available'
      });
    }

    const chunkSize = 500;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const { error } = await supabase
        .from('lottery_numbers')
        .insert(rows.slice(i, i + chunkSize));

      if (error) {
        console.error('Pool insert error:', error);
        break;
      }
    }
  }

  /* -----------------------------
     CREATE LOTTERY
  ------------------------------*/
  async function createLottery() {
    creating = true;

    const { data, error } = await supabase
      .from('lotteries')
      .insert({
        name: form.title,
        prize: form.prize,
        entry_fee: form.ticket_price,
        draw_time: form.draw_date,
        total_numbers: form.pool_size,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      creating = false;
      return;
    }

    await createNumberPool(data.id, form.pool_size);

    form = {
      title: '',
      prize: 0,
      ticket_price: 0,
      draw_date: '',
      pool_size: 1000
    };

    creating = false;
    loadData();
  }

  /* -----------------------------
     LOAD DATA
  ------------------------------*/
  async function loadData() {
    loading = true;

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: l, count } = await supabase
      .from('lotteries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    lotteries = l || [];
    total = count || 0;

    const ids = lotteries.map(l => l.id);

    if (ids.length > 0) {
      const { data: n } = await supabase
        .from('lottery_numbers')
        .select('*')
        .in('lottery_id', ids);

      numbers = n || [];
    } else {
      numbers = [];
    }

    loading = false;
  }

  onMount(loadData);
  $: loadData();

  /* -----------------------------
     PAGINATION
  ------------------------------*/
  function totalPages() {
    return Math.ceil(total / pageSize);
  }

  function nextPage() {
    if (page < totalPages() - 1) page += 1;
  }

  function prevPage() {
    if (page > 0) page -= 1;
  }

  /* -----------------------------
     DRAW WINNER
  ------------------------------*/
  async function drawWinner(id) {
    const { data } = await supabase
      .from('lottery_numbers')
      .select('*')
      .eq('lottery_id', id)
      .eq('status', 'reserved');

    if (!data?.length) return alert("No entries");

    const winner = data[Math.floor(Math.random() * data.length)];

    await supabase.from('winners').insert({
      lottery_id: id,
      user_id: winner.user_id,
      winning_number: winner.number,
      created_at: new Date()
    });

    await supabase
      .from('lotteries')
      .update({
        status: 'completed',
        is_drawn: true,
        winning_number: winner.number
      })
      .eq('id', id);

    loadData();
  }
</script>

<AppShell>
  <span slot="title">Lottery Admin</span>

  {#if !isAdmin}
    <div class="center">
      <Shield size={50} />
      <h2>Admin only</h2>
    </div>

  {:else}

    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi kpi-blue">
        <Activity />
        <div>
          <h3>{total}</h3>
          <p>Total Lotteries</p>
        </div>
      </div>

      <div class="kpi kpi-green">
        <Users />
        <div>
          <h3>{numbers.length}</h3>
          <p>Total Entries</p>
        </div>
      </div>

      <div class="kpi kpi-purple">
        <Wallet />
        <div>
          <h3>₹{numbers.length * 10}</h3>
          <p>Estimated Revenue</p>
        </div>
      </div>
    </div>

    <div class="layout">

      <!-- CREATE -->
      <div class="panel glass">
        <h2><Plus size={18}/> Create Lottery</h2>

        <input placeholder="Name" bind:value={form.title} />
        <input type="number" placeholder="Prize" bind:value={form.prize} />
        <input type="number" placeholder="Entry Fee" bind:value={form.ticket_price} />
        <input type="datetime-local" bind:value={form.draw_date} />
        <input type="number" placeholder="Pool Size" bind:value={form.pool_size} />

        <button class="primary glow" on:click={createLottery} disabled={creating}>
          {creating ? 'Creating...' : 'Create Lottery'}
        </button>
      </div>

      <!-- LIST -->
      <div class="panel">
        <h2><Sparkles size={18}/> Active Lotteries</h2>

        {#if loading}
          <p class="muted">Loading...</p>
        {/if}

        <div class="grid">
          {#each lotteries as l}
            <div class="card">

              <div class="card-header">
                <div class="title">{l.name}</div>
                <span class="badge">{l.status}</span>
              </div>

              <div class="stats">
                <div><b>{plays(l.id)}</b><span>Plays</span></div>
                <div><b>{available(l.id)}</b><span>Available</span></div>
                <div><b>₹{l.prize}</b><span>Prize</span></div>
                <div><b>₹{plays(l.id) * (l.entry_fee || 0)}</b><span>Revenue</span></div>
              </div>

              <button class="draw" on:click={() => drawWinner(l.id)}>
                🎯 Draw Winner
              </button>

            </div>
          {/each}
        </div>

        <div class="pagination">
          <button on:click={prevPage}><ChevronLeft/></button>
          <span>Page {page + 1} / {totalPages()}</span>
          <button on:click={nextPage}><ChevronRight/></button>
        </div>

      </div>
    </div>

  {/if}
</AppShell>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(320px, 380px) 1fr;
    gap: 16px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .kpi {
    padding: 16px;
    border-radius: 14px;
    color: white;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .kpi-blue { background: linear-gradient(135deg,#3b82f6,#2563eb); }
  .kpi-green { background: linear-gradient(135deg,#22c55e,#16a34a); }
  .kpi-purple { background: linear-gradient(135deg,#a855f7,#7c3aed); }

  .panel {
    background: white;
    border-radius: 16px;
    padding: 16px;
  }

  .glass {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(10px);
  }

  .panel input,
  .panel button {
    width: 100%;
    box-sizing: border-box;
  }

  .panel input {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #eee;
  }

  .grid {
    display: grid;
    gap: 12px;
  }

  .card {
    border: 1px solid #f3f4f6;
    border-radius: 14px;
    padding: 14px;
    transition: 0.2s;
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .title { font-weight: 600; }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 10px 0;
  }

  .stats div {
    text-align: center;
    background: #f9fafb;
    padding: 8px;
    border-radius: 10px;
  }

  .draw {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    background: black;
    color: white;
  }

  .primary {
    width: 100%;
    padding: 10px;
    background: #111;
    color: white;
    border-radius: 10px;
  }

  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eee;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
  }

  .center {
    text-align: center;
    padding: 50px;
  }

  .muted {
    opacity: 0.6;
  }
</style>