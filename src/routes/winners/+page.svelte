<script>
  import { Crown } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { getWinners, platform } from '$lib/platform';

  $: winners = getWinners($platform);
</script>

<AppShell>
  <span slot="title">Winners</span>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Public winner board</p>
        <h2>Winning numbers and social handles</h2>
      </div>
      <Crown size={30} />
    </div>
    <div class="winner-grid">
      {#each winners as winner}
        <article>
          <span class="pill">Number {winner.winning_number}</span>
          <h3>{winner.winner?.full_name}</h3>
          <p>{winner.title} · {winner.prize}</p>
          <div class="socials">
            <span>{winner.winner?.instagram}</span>
            <span>{winner.winner?.x_handle}</span>
          </div>
        </article>
      {:else}
        <p class="empty">No winners have been announced yet.</p>
      {/each}
    </div>
  </section>
</AppShell>

<style>
/* ================= PANEL (MATCH DASHBOARD) ================= */
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

/* ================= GRID ================= */
.winner-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 16px;
}

/* ================= CARD ================= */
.winner-grid article {
  border-radius: 18px;
  padding: 16px;

  background: rgba(15,23,42,0.7);
  color: white;

  border: 1px solid rgba(255,255,255,0.06);

  transition: all 0.25s ease;
}

.winner-grid article:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 50px rgba(0,0,0,0.25);
  border-color: rgba(56,189,248,0.3);
}

/* ================= TITLE ================= */
.winner-grid h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin-top: 8px;
  color: #f8fafc;
}

/* ================= TEXT ================= */
.winner-grid p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 4px;
}

/* ================= BADGE ================= */
.pill {
  display: inline-block;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;

  font-size: 0.75rem;
  font-weight: 700;

  padding: 4px 10px;
  border-radius: 999px;
}

/* ================= SOCIAL ================= */
.socials {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.socials span {
  background: rgba(30,41,59,0.9);
  border: 1px solid rgba(255,255,255,0.08);

  border-radius: 999px;
  padding: 4px 8px;

  font-size: 0.75rem;
  color: #cbd5f5;

  transition: 0.2s;
}

.socials span:hover {
  background: rgba(56,189,248,0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

/* ================= EMPTY ================= */
.empty {
  color: #64748b;
  margin-top: 10px;
}

/* ================= ANIMATION ================= */
.panel,
.winner-grid article {
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

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .winner-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .winner-grid {
    grid-template-columns: 1fr;
  }
}
</style>