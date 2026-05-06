<script>
  import '../styles.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { firebaseApp, firebaseConfigured } from '$lib/firebase';
  import { supabase, supabaseConfigured } from '$lib/supabase';

  let loading = true;
  const publicPages = ['/'];

  let handled = false;

  onMount(async () => {
    if (!browser || !firebaseConfigured || !firebaseApp) {
      loading = false;
      return;
    }

    const { getAuth } = await import('firebase/auth');
    const auth = getAuth(firebaseApp);

    auth.onAuthStateChanged(async (user) => {
      if (handled) return;

      const currentPath = $page.url.pathname;
      loading = false;

      // ❌ NOT LOGGED IN
      if (!user?.uid) {
        if (!publicPages.includes(currentPath)) {
          goto('/', { replaceState: true });
        }
        return;
      }

      let profile = null;

      // ✅ FETCH ROLE SAFELY FROM SUPABASE
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('role, is_blocked')
          .eq('firebase_uid', user.uid)
          .maybeSingle();

        if (!error) {
          profile = data;
        }
      }

      console.log('USER ROLE:', profile?.role);

      // ❌ BLOCKED USER
      if (profile?.is_blocked) {
        goto('/');
        return;
      }

      handled = true;

      // ✅ REDIRECT ONLY FROM ROOT PAGE
      if (currentPath === '/') {
        if (profile?.role === 'admin') {
          goto('/admin');
        } else {
          goto('/dashboard');
        }
      }
    });
  });
</script>

<!-- ================= UI ================= -->

{#if loading}
  <div class="splash">
    <div class="logo">
      <img src="/logo.png" alt="logo" />
    </div>

    <h1 class="brand">LotteryPro</h1>

    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
.splash {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background: linear-gradient(135deg, #0f172a, #1e3c72, #0ea5e9);
  background-size: 300% 300%;
  color: white;
  text-align: center;

  animation: bgMove 6s ease infinite, fadeIn 0.4s ease;
}

.logo {
  width: 110px;
  height: 110px;
  margin-bottom: 14px;
  animation: logoPop 0.6s ease, float 2.5s ease-in-out infinite;
}

.logo img {
  width: 100%;
  filter: drop-shadow(0 10px 25px rgba(0,0,0,0.3));
}

.brand {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 1px;

  background: linear-gradient(90deg,#fff,#38bdf8,#2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  margin-bottom: 10px;
}

.dots {
  display: flex;
  gap: 6px;
}

.dots span {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  opacity: 0.3;
  animation: dotPulse 1.2s infinite;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes logoPop {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes float {
  from { transform: translateY(0px); }
  to { transform: translateY(-10px); }
}

@keyframes bgMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 600px) {
  .logo {
    width: 90px;
    height: 90px;
  }

  .brand {
    font-size: 1.3rem;
  }
}
</style>