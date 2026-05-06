<script>
  import { Save, UserRound } from 'lucide-svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { getActiveProfile, platform } from '$lib/platform';

  let loadedProfileId = '';
  let form = {
    full_name: '',
    email: '',
    phone: '',
    instagram: '',
    x_handle: ''
  };
  let errors = {};

  $: activeProfile = getActiveProfile($platform);
  $: if (activeProfile && activeProfile.id !== loadedProfileId) {
    loadedProfileId = activeProfile.id;
    form = {
      full_name: activeProfile.full_name,
      email: activeProfile.email,
      phone: activeProfile.phone,
      instagram: activeProfile.instagram,
      x_handle: activeProfile.x_handle
    };
    errors = {};
  }

  function clearError(field) {
    if (errors[field]) {
      errors = { ...errors, [field]: '' };
    }
  }

  function validateForm() {
    const nextErrors = {};
    const email = form.email.trim();

    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required.';
    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';

    errors = nextErrors;
    return Object.keys(nextErrors).length === 0;
  }

  function saveAccount() {
    if (!validateForm()) return;
    platform.updateProfile({
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      instagram: form.instagram.trim(),
      x_handle: form.x_handle.trim()
    });
  }
</script>

<AppShell>
  <span slot="title">Account</span>

  <section class="grid two">
    <div class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Profile</p>
          <h2>Public winner details</h2>
        </div>
        <UserRound size={28} />
      </div>
      <div class="form-grid">
        <label class="field">
          <input class:error={!!errors.full_name} bind:value={form.full_name} aria-invalid={!!errors.full_name} aria-describedby="full-name-error" aria-label="Full name" placeholder="Full name" on:input={() => clearError('full_name')} />
          {#if errors.full_name}<span id="full-name-error" class="field-error">{errors.full_name}</span>{/if}
        </label>
        <label class="field">
          <input class:error={!!errors.email} bind:value={form.email} type="email" aria-invalid={!!errors.email} aria-describedby="email-error" aria-label="Email" placeholder="Email" on:input={() => clearError('email')} />
          {#if errors.email}<span id="email-error" class="field-error">{errors.email}</span>{/if}
        </label>
        <label class="field">
          <input class:error={!!errors.phone} bind:value={form.phone} aria-invalid={!!errors.phone} aria-describedby="phone-error" aria-label="Phone" placeholder="Phone number" on:input={() => clearError('phone')} />
          {#if errors.phone}<span id="phone-error" class="field-error">{errors.phone}</span>{/if}
        </label>
        <label class="field">
          <input bind:value={form.instagram} aria-label="Instagram" placeholder="Instagram handle" />
        </label>
        <label class="field">
          <input bind:value={form.x_handle} aria-label="X handle" placeholder="X handle" />
        </label>
      </div>
      <button class="primary wide" on:click={saveAccount}>
        <Save size={18} /> Save account
      </button>
    </div>

    <div class="panel profile-card">
      <p class="eyebrow">Winner card preview</p>
      <h2>{form.full_name || 'Your name'}</h2>
      <p>{form.email}</p>
      <div class="socials">
        <span>{form.instagram || '@instagram'}</span>
        <span>{form.x_handle || '@xhandle'}</span>
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
  transform: translateY(-4px);
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
}

/* ================= FORM GRID ================= */
.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

/* ================= FIELD ================= */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ================= INPUT ================= */
input {
  padding: 12px;
  border-radius: 12px;

  background: rgba(15,23,42,0.6);
  color: white;

  border: 1px solid rgba(255,255,255,0.08);

  transition: 0.25s;
}

/* focus */
input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,0.2);
  transform: scale(1.02);
}

/* error */
input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.14);
}

/* ================= ERROR ================= */
.field-error {
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ================= BUTTON ================= */
.primary {
  margin-top: 16px;
  border-radius: 12px;

  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  color: white;

  transition: 0.25s;
}

.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 15px 40px rgba(59,130,246,0.4);
}

/* ================= PROFILE CARD ================= */
.profile-card {
  display: flex;
  flex-direction: column;
  justify-content: center;

  background:
    linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.6)),
    radial-gradient(circle at top right, rgba(56,189,248,0.2), transparent);

  border: 1px solid rgba(255,255,255,0.08);
}

/* name */
.profile-card h2 {
  margin-top: 10px;
  font-weight: 800;
}

/* email */
.profile-card p {
  color: #94a3b8;
  margin-top: 4px;
}

/* ================= SOCIAL ================= */
.socials {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.socials span {
  background: rgba(30,41,59,0.9);
  border: 1px solid rgba(255,255,255,0.08);

  border-radius: 999px;
  padding: 6px 10px;

  font-size: 0.75rem;
  color: #cbd5f5;

  transition: 0.2s;
}

.socials span:hover {
  background: rgba(56,189,248,0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

/* ================= ANIMATION ================= */
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

/* ================= RESPONSIVE ================= */
@media (max-width: 900px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
