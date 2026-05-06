<script>
  import { CreditCard, FileCheck2, Trophy } from 'lucide-svelte';
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
  $: entries = getUserEntries($platform, activeProfile?.id);
  $: winningEntries = entries.filter((entry) => entry.lottery?.winner_profile_id === activeProfile?.id);

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

  function savePayout() {
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
  <span slot="title">My Entries</span>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Lottery status</p>
        <h2>Your numbers and winner notices</h2>
      </div>
      <FileCheck2 size={28} />
    </div>

    <div class="entry-list">
      {#each entries as entry}
        <article>
          <div>
            <strong>{entry.number}</strong>
            <span>{entry.lottery?.title} · {entry.lottery?.prize}</span>
          </div>
          <span class="pill">{entry.lottery?.winning_number === entry.number ? 'Winner' : entry.lottery?.status}</span>
        </article>
      {:else}
        <p class="empty">No entries yet. Enter a lottery to track it here.</p>
      {/each}
    </div>
  </section>

  <section class="grid two">
    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Winner payout</p>
          <h2>Payment details</h2>
        </div>
        <CreditCard size={28} />
      </div>

      {#if winningEntries.length}
        <div class="form-grid">
          <label class="field">
            <input class:error={!!errors.bank_name} bind:value={payout.bank_name} aria-invalid={!!errors.bank_name} aria-describedby="entry-bank-name-error" aria-label="Bank name" placeholder="Bank name" on:input={() => clearError('bank_name')} />
            {#if errors.bank_name}<span id="entry-bank-name-error" class="field-error">{errors.bank_name}</span>{/if}
          </label>
          <label class="field">
            <input class:error={!!errors.account_name} bind:value={payout.account_name} aria-invalid={!!errors.account_name} aria-describedby="entry-account-name-error" aria-label="Account name" placeholder="Account name" on:input={() => clearError('account_name')} />
            {#if errors.account_name}<span id="entry-account-name-error" class="field-error">{errors.account_name}</span>{/if}
          </label>
          <label class="field">
            <input class:error={!!errors.account_number} bind:value={payout.account_number} inputmode="numeric" aria-invalid={!!errors.account_number} aria-describedby="entry-account-number-error" aria-label="Account number" placeholder="Account number" on:input={() => clearError('account_number')} />
            {#if errors.account_number}<span id="entry-account-number-error" class="field-error">{errors.account_number}</span>{/if}
          </label>
          <label class="field">
            <input bind:value={payout.payment_note} aria-label="Payment note" placeholder="Payment note" />
          </label>
        </div>
        <button class="primary wide" on:click={savePayout}>
          <CreditCard size={18} /> Save payout details
        </button>
      {:else}
        <p class="empty">Payment details unlock here once one of your numbers wins.</p>
      {/if}
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Winning entries</p>
          <h2>Ready for manual payout</h2>
        </div>
        <Trophy size={28} />
      </div>
      <div class="entry-list">
        {#each winningEntries as entry}
          <article>
            <div><strong>{entry.lottery?.title}</strong><span>Winning number {entry.number}</span></div>
            <span class="pill">{entry.payout?.status ?? 'Needs payment details'}</span>
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
  transform: translateY(-3px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
}

/* ================= HEADING ================= */
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= ENTRY LIST ================= */
.entry-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.entry-list article {
  display: flex;
  justify-content: space-between;
  align-items: center;

  border-radius: 14px;
  padding: 14px;

  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.06);

  transition: 0.25s;
}

.entry-list article:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}

/* ================= TEXT ================= */
.entry-list span,
.panel span {
  color: #94a3b8;
}

/* ================= BADGE ================= */
.pill {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;

  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.75rem;
}

/* ================= FORM ================= */
.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

/* field wrapper */
.field {
  display: grid;
  gap: 6px;
}

/* ================= INPUT ================= */
input {
  background: rgba(15,23,42,0.8);
  color: white;

  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;

  padding: 10px;

  transition: 0.25s;
}

input::placeholder {
  color: #64748b;
}

/* hover */
input:hover {
  border-color: rgba(56,189,248,0.4);
}

/* focus */
input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,0.2);
}

/* error */
input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.2);
}

/* ================= ERROR TEXT ================= */
.field-error {
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ================= BUTTON ================= */
.primary {
  margin-top: 14px;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;

  border-radius: 10px;
  padding: 10px;

  transition: 0.25s;
}

.primary:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 15px 40px rgba(59,130,246,0.3);
}

/* ================= EMPTY TEXT ================= */
.empty {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 10px;
}

/* ================= GRID ================= */
.grid.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
