<script>
  import { page } from '$app/stores';
  import { ArrowLeft, Sparkles, Ticket } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let selectedNumberId = '';
  let error = '';
  let loading = false;

  let lottery = null;
  let numbers = [];
  let plays = 0;

  /* ================= LOAD DATA ================= */
  async function loadLottery() {
    const id = $page.params.id;

    const { data: lot } = await supabase
      .from('lotteries')
      .select('*')
      .eq('id', id)
      .single();

    lottery = lot;

    const { data: nums } = await supabase
      .from('lottery_numbers')
      .select('*')
      .eq('lottery_id', id)
      .order('number', { ascending: true });

    numbers = nums || [];

    plays = numbers.filter(n => n.status === 'reserved').length;
  }

  onMount(loadLottery);

  /* ================= SELECT ================= */
  function selectNumber(id) {
    selectedNumberId = id;
    error = '';
  }

  /* ================= ENTER LOTTERY (DB SAFE) ================= */
  async function enterLottery() {
    if (!selectedNumberId) {
      error = 'Select an entry number first.';
      return;
    }

    loading = true;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // check if already reserved (anti double entry)
    const { data: check } = await supabase
      .from('lottery_numbers')
      .select('status')
      .eq('id', selectedNumberId)
      .single();

    if (check?.status === 'reserved') {
      error = 'This number is already taken.';
      loading = false;
      return;
    }

    // reserve number
    const { error: updateError } = await supabase
      .from('lottery_numbers')
      .update({
        status: 'reserved',
        reserved_by: userId
      })
      .eq('id', selectedNumberId);

    if (updateError) {
      error = 'Failed to reserve number.';
      loading = false;
      return;
    }

    selectedNumberId = '';
    await loadLottery();

    loading = false;
  }
</script>

<AppShell>
  <span slot="title">{lottery?.title ?? 'Lottery Detail'}</span>

  {#if lottery}
    <section class="panel detail-hero">
      <a class="ghost-link" href="/lotteries">
        <ArrowLeft size={18} /> Back
      </a>

      <div>
        <p>
  {plays} plays · 
  ₹{Number(lottery?.entry_fee || 0).toLocaleString()} entry ·
  draw {lottery?.draw_date }
</p>
      </div>

      <span class="pill">{lottery.status}</span>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Generated number pool</p>
          <h2>Select one entry number</h2>
        </div>
        <Sparkles size={28} />
      </div>

      <div class="number-grid">
        {#each numbers as number}
          <button
            class:active={selectedNumberId === number.id}
            class:reserved={number.status === 'reserved'}
            disabled={number.status === 'reserved'}
            on:click={() => selectNumber(number.id)}
          >
            {number.number}
          </button>
        {/each}
      </div>

      {#if error}
        <p class="field-error">{error}</p>
      {/if}

      <button class="primary" on:click={enterLottery} disabled={loading}>
        <Ticket size={18} />
        {loading ? 'Processing...' : 'Enter this lottery'}
      </button>
    </section>
  {:else}
    <section class="panel">
      <h2>Lottery not found</h2>
      <a class="primary" href="/lotteries">Back to lotteries</a>
    </section>
  {/if}
</AppShell>
<style>
  .field-error {
    color: #dc2626;
    font-size: 0.88rem;
    font-weight: 700;
    margin: 10px 0 0;
  }
  /* ================= PANEL ================= */
.panel {
  border-radius: 22px;
  padding: 22px;

  background: rgba(30,41,59,0.9);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);

  transition: all 0.3s ease;
}

.panel:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
}

/* ================= DETAIL HERO ================= */
.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  border-radius: 22px;
  padding: 24px;

  background:
    linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.65)),
    radial-gradient(circle at top right, rgba(56,189,248,0.25), transparent);

  border: 1px solid rgba(255,255,255,0.08);
  color: white;

  transition: 0.3s ease;
}

.detail-hero:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 80px rgba(37,99,235,0.25);
}

/* ================= BACK LINK ================= */
.ghost-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  background: rgba(255,255,255,0.08);
  padding: 6px 12px;
  border-radius: 12px;

  font-size: 0.85rem;

  transition: 0.25s;
}

.ghost-link:hover {
  background: rgba(255,255,255,0.18);
  transform: translateX(-4px);
}

/* ================= NUMBER GRID ================= */
.number-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin: 18px 0;
}

/* ================= NUMBER BUTTON ================= */
.number-grid button {
  border-radius: 14px;
  padding: 14px;

  background: rgba(30,41,59,0.95);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  font-weight: 700;
  font-size: 0.9rem;

  transition: all 0.25s ease;
}

/* hover */
.number-grid button:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.06);
  border-color: rgba(56,189,248,0.4);
  box-shadow: 0 12px 30px rgba(56,189,248,0.25);
}

/* active */
.number-grid button.active {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  box-shadow: 0 10px 35px rgba(59,130,246,0.45);
}

/* reserved */
.number-grid button.reserved {
  background: rgba(148,163,184,0.15);
  color: #94a3b8;
  text-decoration: line-through;
  cursor: not-allowed;
}

/* ================= PANEL HEADING ================= */
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= BUTTON ================= */
.primary {
  margin-top: 16px;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  border-radius: 12px;

  font-weight: 600;

  transition: all 0.25s ease;
}

.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 18px 45px rgba(59,130,246,0.35);
}

/* ================= BADGE ================= */
.pill {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;

  border-radius: 999px;
  padding: 6px 12px;

  font-size: 0.75rem;
  font-weight: 700;
}

/* ================= ERROR ================= */
.field-error {
  color: #f87171;
  font-size: 0.85rem;
  margin-top: 10px;
}

/* ================= ANIMATION ================= */
.panel,
.detail-hero,
.number-grid button {
  animation: fadeInUp 0.4s ease both;
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

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .number-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 600px) {
  .number-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
