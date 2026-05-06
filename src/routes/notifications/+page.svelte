<script>
  import { Bell, CheckCircle2 } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { getActiveProfile, getNotifications, platform } from '$lib/platform';

  $: activeProfile = getActiveProfile($platform);
  $: notifications = getNotifications($platform, activeProfile?.id);
</script>

<AppShell>
  <span slot="title">Notifications</span>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Final notices</p>
        <h2>Draw results and account updates</h2>
      </div>
      <Bell size={28} />
    </div>
    <div class="timeline">
      {#each notifications as notification}
        <article class:success={notification.tone === 'success'}>
          {#if notification.tone === 'success'}<CheckCircle2 size={20} />{:else}<Bell size={20} />{/if}
          <div>
            <strong>{notification.title}</strong>
            <span>{notification.body}</span>
          </div>
        </article>
      {:else}
        <p class="empty">No notifications yet.</p>
      {/each}
    </div>
  </section>
</AppShell>
<style>
/* ================= PANEL ================= */
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

/* ================= HEADING ================= */
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= TIMELINE ================= */
.timeline {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ================= ITEM ================= */
.timeline article {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  padding: 14px;
  border-radius: 16px;

  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.06);

  transition: 0.25s ease;
}

/* hover */
.timeline article:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 50px rgba(0,0,0,0.25);
  border-color: rgba(56,189,248,0.3);
}

/* ================= ICON ================= */


/* ================= TEXT ================= */
.timeline strong {
  display: block;
  font-weight: 700;
  color: #f8fafc;
}

.timeline span {
  font-size: 0.9rem;
  color: #94a3b8;
}

/* ================= SUCCESS ================= */
.timeline article.success {
  border-color: rgba(34,197,94,0.4);
  background: rgba(34,197,94,0.08);
}
/* 
.timeline article.success svg {
  color: #22c55e;
} */

/* ================= EMPTY ================= */
.empty {
  color: #64748b;
  margin-top: 10px;
}

/* ================= ANIMATION ================= */
.timeline article {
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
@media (max-width: 600px) {
  .timeline article {
    padding: 12px;
  }
}
</style>