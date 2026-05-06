<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>App Error</title>
</svelte:head>

<main class="error-shell">
  <section class="error-panel">
    <p class="eyebrow">Something needs attention</p>
    <h1>{$page.status}</h1>
    <p>{$page.error?.message ?? 'The app hit an unexpected error.'}</p>
    <a href="/">Return to lottery platform</a>
  </section>
</main>

<style>
  .error-shell {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 24px;
  }

  .error-panel {
    background: #ffffff;
    border: 1px solid #e2e7f0;
    border-radius: 8px;
    box-shadow: 0 18px 55px rgba(39, 50, 76, 0.08);
    max-width: 520px;
    padding: 28px;
    width: 100%;
  }

  h1 {
    font-size: 4rem;
    margin: 0 0 0.5rem;
  }

  p {
    color: #657189;
    margin: 0 0 1rem;
  }

  a {
    align-items: center;
    background: #176b8f;
    border-radius: 8px;
    color: #ffffff;
    display: inline-flex;
    font-weight: 800;
    min-height: 42px;
    padding: 0.7rem 0.95rem;
    text-decoration: none;
  }
</style>
