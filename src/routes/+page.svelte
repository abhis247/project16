<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { CheckCircle2, Database, LogIn, Shield, Sparkles, Ticket } from 'lucide-svelte';
  import { firebaseApp, firebaseConfigured } from '$lib/firebase';
  import { supabaseConfigured } from '$lib/supabase';
  import { supabase } from '$lib/supabase';
  import { platform } from '$lib/platform';

  let authMode = 'register';
  let form = {
    fullName: '',
    email: '',
    password: '',
    phone: ''
  };
let menuOpen = false;

function toggleMenu() {
  menuOpen = !menuOpen;
}
  let authError = '';

  // ✨ TYPEWRITER
  let displayText = '';
  let fullText = 'LotteryPro';
  let i = 0;

  function typeText() {
    if (i < fullText.length) {
      displayText += fullText[i];
      i++;
      setTimeout(typeText, 70);
    }
  }

  if (browser) {
    setTimeout(typeText, 300);
  }
async function submitAuth() {
  authError = '';

  try {
    const {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      updateProfile
    } = await import('firebase/auth');

    const auth = getAuth(firebaseApp);

    let userCredential;

    // ================= REGISTER =================
    if (authMode === 'register') {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      if (form.fullName) {
        await updateProfile(user, {
          displayName: form.fullName
        });
      }

      // Save user in Supabase
      await supabase.from('users').upsert({
        firebase_uid: user.uid,
        name: form.fullName,
        email: user.email,
        phone: form.phone,
        role: 'user'
      });
    }

    // ================= LOGIN =================
    else {
      userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
    }

    const user = userCredential.user;

    // ================= GET ROLE FROM SUPABASE =================
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('firebase_uid', user.uid)
      .maybeSingle();

    if (error) throw error;

    const role = data?.role || 'user';

    console.log("ROLE:", role);

    // ================= ROUTING =================
    if (role === 'admin') {
      goto('/admin');
    } else {
      goto('/dashboard');
    }

  } catch (error) {
    console.error(error);
    authError = error?.message || 'Authentication failed.';
  }
}
async function signInWithGoogle() {
  authError = '';

  try {
    const { getAuth, GoogleAuthProvider, signInWithPopup } =
      await import('firebase/auth');

    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // check Supabase
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('firebase_uid', user.uid)
      .maybeSingle();

    const role = data?.role || 'user';

    if (!data) {
      await supabase.from('users').insert({
        firebase_uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: 'user'
      });
    }

    if (role === 'admin') {
      goto('/admin/dashboard');
    } else {
      goto('/dashboard');
    }

  } catch (err) {
    console.error(err);
    authError = 'Google sign-in failed.';
  }
}
</script>

<svelte:head>
  <title>LotteryPro</title>
</svelte:head>
<header class="site-header">
  <div class="logo">
    🎟️ LotteryPro
  </div>

  <nav class="nav">
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/winners">Winners</a>
    <a href="/wallet">Wallet</a>
  </nav>
<button class="hamburger" on:click={toggleMenu}>
  ☰
</button>
  <div class="auth-buttons">
    <!-- <a class="btn-outline" href="/login">Login</a>
    <a class="btn-primary" href="/register">Get Started</a> -->
  </div>
</header>
{#if menuOpen}
  <div class="overlay" on:click={toggleMenu}></div>

  <div class="mobile-menu">
    <a href="/" on:click={toggleMenu}>Home</a>
    <a href="/dashboard" on:click={toggleMenu}>Dashboard</a>
    <a href="/winners" on:click={toggleMenu}>Winners</a>
    <a href="/wallet" on:click={toggleMenu}>Wallet</a>

    <div class="mobile-actions">
      <a href="/login" on:click={toggleMenu}>Login</a>
      <a href="/register" class="primary" on:click={toggleMenu}>Get Started</a>
    </div>
  </div>
{/if}
<main class="landing">
  <section class="landing-hero">

    <!-- HERO -->
    <div class="hero-copy">
      <p class="eyebrow">Firebase auth + Supabase database</p>

      <h1 class="animated-title">
        {displayText}<span class="cursor">|</span>
      </h1>

      <p class="hero-text">
        A focused lottery platform for wallet-funded entries, daily draws, public winner notices, and admin operations.
      </p>

      <p class="hero-badge">
        🎯 Fair draws • 💰 Wallet system • 🔥 Daily winners
      </p>

      <div class="hero-actions">
        <a class="primary" href="/dashboard">
          <Ticket size={18}/> Open dashboard
        </a>

        <a class="ghost-link" href="/winners">
          <Sparkles size={18}/> View winners
        </a>
      </div>


      <section class="extra-content">

  <div class="section-title">
    <h2>How it works</h2>
    <p>Simple 3-step process to join and win</p>
  </div>

  <div class="steps">
    <div class="step">
      <h3>1. Create account</h3>
      <p>Sign up using email or Google instantly.</p>
    </div>

    <div class="step">
      <h3>2. Add wallet balance</h3>
      <p>Deposit funds securely using Razorpay.</p>
    </div>

    <div class="step">
      <h3>3. Join lottery</h3>
      <p>Select numbers and participate in daily draws.</p>
    </div>
  </div>

</section>

<section class="trust-section">

  <div class="trust-card">
    <h3>🔒 Secure System</h3>
    <p>Firebase authentication + Supabase database security.</p>
  </div>

  <div class="trust-card">
    <h3>⚡ Instant Processing</h3>
    <p>Real-time wallet updates and fast entry system.</p>
  </div>

  <div class="trust-card">
    <h3>📊 Transparent Results</h3>
    <p>Every draw is recorded and publicly verifiable.</p>
  </div>

</section>
      <section class="info-section">
    


  <div class="info-card">
    <h3>🎯 Fair System</h3>
    <p>Transparent lottery draws powered by secure backend logic.</p>
  </div>

  <div class="info-card">
    <h3>💰 Wallet Ready</h3>
    <p>Deposit, withdraw, and manage funds easily with secure wallet.</p>
  </div>

  <div class="info-card">
    <h3>🔥 Daily Winners</h3>
    <p>Every day brings new chances to win big rewards instantly.</p>
  </div>

</section>
    </div>

    <!-- FORM -->
    <form class="auth-card" on:submit|preventDefault={submitAuth}>
      <div class="segmented">
        <button type="button" class:active={authMode === 'register'} on:click={() => authMode = 'register'}>
          Register
        </button>

        <button type="button" class:active={authMode === 'login'} on:click={() => authMode = 'login'}>
          Login
        </button>
      </div>

      {#if authMode === 'register'}
        <input bind:value={form.fullName} placeholder="Full name" />
        <input bind:value={form.phone} placeholder="Phone number" />
      {/if}

      <input bind:value={form.email} type="email" placeholder="Email" />
      <input bind:value={form.password} type="password" placeholder="Password" />

      <button class="primary wide" type="submit">
        <CheckCircle2 size={18}/>
        {authMode === 'register' ? 'Create account' : 'Login'}
      </button>

      <button type="button" class="google-button wide" on:click={signInWithGoogle}>
        <LogIn size={18}/> Continue with Google
      </button>

      {#if authError}
        <p class="error">{authError}</p>
      {/if}

      <div class="status-row">
        <span class:ready={firebaseConfigured}>
          <Shield size={14}/> Firebase
        </span>
        <span class:ready={supabaseConfigured}>
          <Database size={14}/> Supabase
        </span>
      </div>
    </form>

  </section>
</main>
<footer class="site-footer">
  <div class="footer-grid">

    <div>
      <h3>LotteryPro</h3>
      <p>Modern lottery platform with secure wallet system and daily draws.</p>
    </div>

    <div>
      <h4>Links</h4>
      <a href="/">Home</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/winners">Winners</a>
    </div>

    <div>
      <h4>Legal</h4>
      <a href="#">Terms</a>
      <a href="#">Privacy</a>
    </div>

  </div>

  <div class="footer-bottom">
    © {new Date().getFullYear()} LotteryPro. All rights reserved.
  </div>
</footer>
<style>
  /* ================= ROOT ================= */
:global(body) {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #0b1220;
  color: white;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* ================= BACKGROUND ================= */
.landing {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 100px 20px 80px;

  background:
    linear-gradient(-45deg, rgba(15,23,42,0.85), rgba(30,41,59,0.85), rgba(14,165,233,0.65)),
    url("https://images.unsplash.com/photo-1518544889280-9b2b5c9fbd44?auto=format&fit=crop&w=1600");

  background-size: 400% 400%, cover;
  animation: gradientMove 14s ease infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}

/* ================= HEADER ================= */
.site-header {
  position: sticky;
  top: 0;
  z-index: 999;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 14px 28px;

  background: rgba(10,15,30,0.6);
  backdrop-filter: blur(20px);

  border-bottom: 1px solid rgba(255,255,255,0.08);

  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
}

.logo {
  font-weight: 900;
}

/* ================= NAV ================= */
.nav {
  display: flex;
  gap: 18px;
}

.nav a {
  color: #cbd5e1;
  text-decoration: none;
  transition: 0.25s;
}

.nav a:hover {
  color: #38bdf8;
  transform: translateY(-2px);
}

/* ================= BUTTONS ================= */
.btn-primary,
.primary {
  background: linear-gradient(135deg,#3b82f6,#14b8a6);
  padding: 10px 16px;
  border-radius: 12px;
  color: white;
  border: none;
  cursor: pointer;
  transition: 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.btn-primary:hover,
.primary:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 18px 40px rgba(56,189,248,0.25);
}

.btn-outline {
  border: 1px solid rgba(255,255,255,0.2);
  padding: 10px 14px;
  border-radius: 12px;
  color: white;
}

/* ================= HERO LAYOUT FIX (IMPORTANT) ================= */
.landing-hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 50px;

  max-width: 1150px;
  width: 100%;

  align-items: start;
}

/* ================= HERO ================= */
.hero-copy {
  animation: floatHero 6s ease-in-out infinite;
}

@keyframes floatHero {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.animated-title {
  font-size: 3.2rem;
  font-weight: 900;

  background: linear-gradient(90deg,#fff,#38bdf8,#2dd4bf,#a78bfa);
  background-size: 200% auto;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: textShift 6s linear infinite;
}

@keyframes textShift {
  to { background-position: 200% center; }
}

.cursor {
  color: #38bdf8;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.hero-text {
  margin-top: 14px;
  color: #cbd5e1;
  line-height: 1.6;
}

.hero-badge {
  margin-top: 12px;
  color: #22d3ee;
  font-weight: 600;
}

.hero-actions {
  margin-top: 22px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* ================= FORM FIX (STICKY + BALANCED) ================= */
.auth-card {
  position: sticky;
  top: 110px;

  align-self: flex-start;

  padding: 26px;
  border-radius: 18px;

  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(22px);

  border: 1px solid rgba(255,255,255,0.12);

  box-shadow: 0 30px 80px rgba(0,0,0,0.4);

  transition: 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
}

/* inputs */
.auth-card input {
  width: 100%;
  margin-top: 12px;
  padding: 12px 14px;

  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);

  background: rgba(0,0,0,0.25);
  color: white;

  transition: 0.25s;
}

.auth-card input:focus {
  outline: none;
  border-color: #38bdf8;
  transform: scale(1.02);
}

/* ================= SPACING SYSTEM FIX ================= */
.extra-content {
  margin-top: 90px;
  text-align: center;
}

.info-section {
  margin-top: 70px;
}

.steps {
  margin-top: 50px;
}

.trust-section {
  margin-top: 60px;
}

/* ================= GRID ================= */
.info-section,
.steps,
.trust-section {
  display: grid;
  gap: 22px;
}

/* ================= CARDS ================= */
.info-card,
.step {
  padding: 22px;
  border-radius: 16px;

  background: rgba(15,23,42,0.55);
  border: 1px solid rgba(255,255,255,0.08);

  transition: 0.3s ease;
  box-shadow: 0 10px 25px rgba(0,0,0,0.25);
}

.trust-card {
  padding: 22px;
  border-radius: 16px;

  background: rgba(30,41,59,0.65);
  border: 1px solid rgba(255,255,255,0.12);

  box-shadow: 0 15px 35px rgba(0,0,0,0.3);
}

.info-card:hover,
.step:hover,
.trust-card:hover {
  transform: translateY(-8px);
  border-color: rgba(56,189,248,0.5);
  box-shadow: 0 25px 50px rgba(56,189,248,0.18);
}

/* ================= FOOTER ================= */
.site-footer {
  margin-top: 100px;
  padding: 50px 20px;

  background: rgba(10,15,30,0.9);
  backdrop-filter: blur(14px);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 25px;
}

.footer-bottom {
  margin-top: 25px;
  text-align: center;
  color: #94a3b8;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 1024px) {
  .landing-hero {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 35px;
  }

  .auth-card {
    position: relative;
    top: auto;
    max-width: 420px;
    margin: 0 auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .info-section,
  .steps,
  .trust-section,
  .footer-grid {
    grid-template-columns: repeat(2,1fr);
  }
}

@media (max-width: 640px) {
  .animated-title {
    font-size: 2.1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .info-section,
  .steps,
  .trust-section,
  .footer-grid {
    grid-template-columns: 1fr;
  }

  .nav {
    display: none;
  }
}
/* ================= HEADER (PREMIUM GLASS + STICKY) ================= */
.site-header {
  position: sticky;
  top: 0;
  z-index: 999;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 14px 34px;

  background: rgba(10, 15, 30, 0.55);
  backdrop-filter: blur(22px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
  transition: all 0.3s ease;
}

/* logo */
.logo {
  font-weight: 900;
  font-size: 1.15rem;
  letter-spacing: 0.6px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* nav */
.nav {
  display: flex;
  gap: 22px;
  align-items: center;
}

.nav a {
  position: relative;
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  transition: 0.25s ease;
  padding: 6px 2px;
}

/* underline animation */
.nav a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg, #38bdf8, #14b8a6);
  transition: 0.3s ease;
  border-radius: 10px;
}

.nav a:hover {
  color: #38bdf8;
}

.nav a:hover::after {
  width: 100%;
}

/* ================= BUTTONS (ULTRA MODERN) ================= */

/* base button */
.btn-primary,
.primary {
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  padding: 10px 18px;
  border-radius: 14px;

  color: white;
  border: none;
  cursor: pointer;

  font-weight: 600;
  letter-spacing: 0.3px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  transition: all 0.25s ease;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.25);
}

/* hover glow */
.btn-primary:hover,
.primary:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow:
    0 18px 45px rgba(56, 189, 248, 0.35),
    0 0 20px rgba(20, 184, 166, 0.25);
}

/* outline button */
.btn-outline {
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 10px 16px;
  border-radius: 14px;

  color: white;
  background: rgba(255, 255, 255, 0.02);

  transition: 0.25s ease;
  backdrop-filter: blur(10px);
}

.btn-outline:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(56, 189, 248, 0.15);
}

/* auth button group spacing */
.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* ================= FOOTER (PREMIUM DARK GLASS) ================= */
.site-footer {
  margin-top: 100px;
  padding: 60px 24px;

  background: rgba(8, 12, 24, 0.92);
  backdrop-filter: blur(18px);

  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* footer grid */
.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 1100px;
  margin: 0 auto;
}

/* footer headings */
.footer-grid h3,
.footer-grid h4 {
  color: #ffffff;
  margin-bottom: 10px;
}

/* footer links */
.footer-grid a {
  display: block;
  color: #94a3b8;
  text-decoration: none;
  margin-top: 8px;
  transition: 0.2s;
}

.footer-grid a:hover {
  color: #38bdf8;
  transform: translateX(4px);
}

/* footer bottom */
.footer-bottom {
  margin-top: 30px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .site-header {
    padding: 12px 18px;
  }

  .nav {
    display: none;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .auth-buttons {
    gap: 8px;
  }
}
/* REMOVE UNDERLINE FROM HEADER BUTTON LINKS */
.auth-buttons a {
  text-decoration: none;
}

/* extra safety for all buttons */
.auth-buttons a:hover {
  text-decoration: none;
}
/* ================= HAMBURGER BUTTON ================= */
.hamburger {
  display: none;
  font-size: 1.8rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
}

/* ================= OVERLAY ================= */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 998;
}

/* ================= MOBILE MENU DRAWER ================= */
.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;

  width: 280px;
  height: 100vh;

  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(18px);

  border-left: 1px solid rgba(255,255,255,0.08);

  z-index: 999;

  padding: 80px 20px;

  display: flex;
  flex-direction: column;
  gap: 16px;

  animation: slideIn 0.3s ease;
}

/* links */
.mobile-menu a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 10px;
  border-radius: 10px;
  transition: 0.2s;
}

.mobile-menu a:hover {
  background: rgba(56,189,248,0.1);
  color: #38bdf8;
  transform: translateX(5px);
}

/* bottom buttons */
.mobile-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* animation */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .nav {
    display: none;
  }

  .hamburger {
    display: block;
  }
}
</style>