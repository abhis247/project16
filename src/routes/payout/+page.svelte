<script>
  import { CreditCard, Trophy } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { getActiveProfile, getUserEntries, platform } from '$lib/platform';

  let payout = {
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_note: ''
  };
  let errors = {};

  $: activeProfile = getActiveProfile($platform);
  $: winningEntries = getUserEntries($platform, activeProfile?.id).filter(
    (entry) => entry.lottery?.winner_profile_id === activeProfile?.id
  );

  function clearError(field) {
    if (errors[field]) {
      errors = { ...errors, [field]: '' };
    }
  }

  function validatePayout() {
    const nextErrors = {};

    if (!payout.bank_name.trim()) nextErrors.bank_name = 'Bank name is required.';
    if (!payout.account_name.trim()) nextErrors.account_name = 'Account name is required.';
    if (!payout.account_number.trim()) {
      nextErrors.account_number = 'Account number is required.';
    } else if (!/^\d{6,20}$/.test(payout.account_number.trim())) {
      nextErrors.account_number = 'Enter a valid account number.';
    }

    errors = nextErrors;
    return Object.keys(nextErrors).length === 0;
  }

  function submitPayout() {
    if (!validatePayout()) return;
    platform.savePayoutDetails(winningEntries[0].lottery.id, {
      ...payout,
      bank_name: payout.bank_name.trim(),
      account_name: payout.account_name.trim(),
      account_number: payout.account_number.trim(),
      payment_note: payout.payment_note.trim()
    });
  }
</script>

<AppShell>
  <span slot="title">Payout</span>

  <section class="grid two">
    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Winner payment details</p>
          <h2>Manual payout request</h2>
        </div>
        <CreditCard size={28} />
      </div>

      {#if winningEntries.length}
        <div class="form-grid">
          <label class="field">
            <input class:error={!!errors.bank_name} bind:value={payout.bank_name} aria-invalid={!!errors.bank_name} aria-describedby="bank-name-error" aria-label="Bank name" placeholder="Bank name" on:input={() => clearError('bank_name')} />
            {#if errors.bank_name}<span id="bank-name-error" class="field-error">{errors.bank_name}</span>{/if}
          </label>
          <label class="field">
            <input class:error={!!errors.account_name} bind:value={payout.account_name} aria-invalid={!!errors.account_name} aria-describedby="account-name-error" aria-label="Account name" placeholder="Account name" on:input={() => clearError('account_name')} />
            {#if errors.account_name}<span id="account-name-error" class="field-error">{errors.account_name}</span>{/if}
          </label>
          <label class="field">
            <input class:error={!!errors.account_number} bind:value={payout.account_number} inputmode="numeric" aria-invalid={!!errors.account_number} aria-describedby="account-number-error" aria-label="Account number" placeholder="Account number" on:input={() => clearError('account_number')} />
            {#if errors.account_number}<span id="account-number-error" class="field-error">{errors.account_number}</span>{/if}
          </label>
          <label class="field">
            <input bind:value={payout.payment_note} aria-label="Payment note" placeholder="Payment note" />
          </label>
        </div>
        <button class="primary wide" on:click={submitPayout}>
          <CreditCard size={18} /> Submit payout details
        </button>
      {:else}
        <p class="empty">This page activates once one of your lottery numbers wins.</p>
      {/if}
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Eligible wins</p>
          <h2>Payout queue</h2>
        </div>
        <Trophy size={28} />
      </div>
      <div class="entry-list">
        {#each winningEntries as entry}
          <article>
            <div><strong>{entry.lottery?.title}</strong><span>Winning number {entry.number}</span></div>
            <span class="pill">{entry.payout?.status ?? 'Needs details'}</span>
          </article>
        {:else}
          <p class="empty">No winning entries yet.</p>
        {/each}
      </div>
    </div>
  </section>
</AppShell>

<style>
  .field {
    display: grid;
    gap: 6px;
  }

  input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgb(239 68 68 / 0.14);
  }

  .field-error {
    color: #dc2626;
    font-size: 0.82rem;
    font-weight: 700;
  }
  




  /* ================= PANEL (MATCH DARK DASHBOARD) ================= */
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
  margin-bottom: 18px;
}

/* ================= FORM GRID ================= */
.form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 18px;
}

/* ================= FIELD ================= */
.field {
  display: grid;
  gap: 6px;
}

/* ================= INPUT ================= */
input {
  background: rgba(15,23,42,0.7);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;

  padding: 11px 12px;

  transition: 0.25s ease;
}

input::placeholder {
  color: #64748b;
}

input:hover {
  border-color: rgba(56,189,248,0.3);
}

input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,0.2);
  background: rgba(15,23,42,0.85);
}

/* ERROR */
input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.2);
}

.field-error {
  color: #f87171;
  font-size: 0.78rem;
  font-weight: 700;
}

/* ================= BUTTON ================= */
.primary {
  border-radius: 10px;
  font-weight: 800;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;

  transition: 0.25s ease;
}

.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 15px 40px rgba(56,189,248,0.35);
}

/* ================= ENTRY LIST ================= */
.entry-list {
  display: grid;
  gap: 10px;
}

.entry-list article {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 14px;
  border-radius: 14px;

  background: rgba(15,23,42,0.7);
  color: white;

  border: 1px solid rgba(255,255,255,0.06);

  transition: 0.2s;
}

.entry-list article:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  border-color: rgba(56,189,248,0.25);
}

/* ================= TEXT ================= */
.entry-list span {
  color: #94a3b8;
  font-size: 0.85rem;
}

.entry-list strong {
  color: #f8fafc;
  font-weight: 800;
}

/* ================= BADGE ================= */
.pill {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;

  border-radius: 999px;
  padding: 4px 10px;

  font-size: 0.75rem;
  font-weight: 800;
}

/* ================= EMPTY ================= */
.empty {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 10px;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .grid.two {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
