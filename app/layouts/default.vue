<template>
  <div style="min-height: 100vh; background: var(--bg);">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" />
        <div class="brand-name">Sungnikah<span class="brand-suffix">/payments</span></div>
      </div>

      <nav class="nav" style="margin-left: 12px;">
        <button class="nav-item">Overview</button>
        <NuxtLink to="/dashboard/transactions" custom v-slot="{ isActive }">
          <button :class="['nav-item', isActive ? 'active' : '']" @click="$router.push('/dashboard/transactions')">
            Transactions
          </button>
        </NuxtLink>
        <button class="nav-item">Customers</button>
        <button class="nav-item">Payouts</button>
        <button class="nav-item">Webhooks</button>
      </nav>

      <div class="spacer" />

      <button class="searchbar" @click="$emit('cmdK')">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/>
        </svg>
        <span style="flex:1; text-align:left;">Search transactions, customers, references…</span>
        <kbd>⌘K</kbd>
      </button>

      <button class="icon-btn" title="Refresh">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 3v3h-3M13 8a5 5 0 0 1-8.5 3.5L3 10M3 13v-3h3"/>
        </svg>
      </button>
      <button class="icon-btn" title="Notifications">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12V8a4 4 0 0 1 8 0v4l1 1H3l1-1Z"/><path d="M6.5 14a1.5 1.5 0 0 0 3 0"/>
        </svg>
      </button>
      <button class="icon-btn" title="Settings">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="2"/>
          <path d="M8 1.5v2M8 12.5v2M3.5 8h-2M14.5 8h-2M4.4 4.4 3 3M13 13l-1.4-1.4M4.4 11.6 3 13M13 3l-1.4 1.4"/>
        </svg>
      </button>
      <div class="avatar">DP</div>
    </header>

    <slot />
  </div>
</template>

<style scoped>
.topbar {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; gap: 18px;
  padding: 10px 22px;
  height: 56px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border-bottom: 1px solid var(--border);
}

.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(140deg, var(--accent) 0%, color-mix(in oklch, var(--accent) 60%, #000) 100%);
  position: relative;
  box-shadow: inset 0 0 0 .5px rgba(255,255,255,.2);
}
.brand-mark::after {
  content: ""; position: absolute; inset: 6px; border-radius: 3px;
  background: rgba(255,255,255,.92);
  clip-path: polygon(0 100%, 50% 0, 100% 100%, 70% 100%, 50% 45%, 30% 100%);
}
.brand-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: var(--fg); }
.brand-suffix { color: var(--fg-faint); font-weight: 500; margin-left: 2px; }

.nav { display: flex; gap: 2px; }
.nav-item {
  padding: 6px 10px; border-radius: var(--radius-sm); border: 0;
  background: transparent;
  font-size: 13px; color: var(--fg-muted); letter-spacing: -0.005em;
}
.nav-item.active { background: var(--surface); color: var(--fg); box-shadow: var(--shadow-sm); }
.nav-item:hover:not(.active) { color: var(--fg); }

.searchbar {
  flex: 1; max-width: 480px;
  display: flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg-faint);
  font-size: 13px;
  cursor: default;
}
.searchbar:hover { border-color: var(--border-strong); }
.searchbar kbd {
  font-family: var(--font-mono); font-size: 10.5px;
  padding: 1px 5px; border-radius: 4px;
  background: var(--surface-2); border: 1px solid var(--border);
  color: var(--fg-muted);
}

.spacer { flex: 1; }

.icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--fg-muted);
}
.icon-btn:hover { background: var(--surface-2); color: var(--fg); }

.avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(145deg, oklch(0.7 0.13 30), oklch(0.55 0.16 320));
  color: white; font-size: 11px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 0 .5px rgba(255,255,255,.4);
}
</style>
