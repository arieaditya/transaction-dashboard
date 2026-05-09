<script setup lang="ts">
defineProps<{ count: number }>()
defineEmits<{ clear: []; export: []; email: []; refund: [] }>()
</script>

<template>
  <Teleport to="body">
    <div class="bulk-bar">
      <span><strong class="tnum">{{ count }}</strong> selected</span>
      <div class="divider" />
      <button class="btn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2v8m0 0 3-3m-3 3-3-3"/><path d="M3 13h10"/>
        </svg>
        Export
      </button>
      <button class="btn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3.5" width="12" height="9" rx="1.5"/>
          <path d="m2.5 4.5 5.5 4 5.5-4"/>
        </svg>
        Email
      </button>
      <button class="btn danger">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9a5 5 0 1 0 1.5-3.5L3 7M3 3v4h4"/>
        </svg>
        Refund
      </button>
      <button class="x" @click="$emit('clear')">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="m4 4 8 8M12 4l-8 8"/>
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.bulk-bar {
  position: fixed; left: 50%; bottom: 22px;
  transform: translate(-50%, 0);
  display: flex; align-items: center; gap: 10px;
  padding: 8px 8px 8px 14px;
  background: var(--fg); color: var(--bg);
  border-radius: 12px;
  box-shadow: var(--shadow-pop);
  z-index: 60;
  font-size: 13px;
  animation: rise 180ms cubic-bezier(.2,.8,.2,1);
  white-space: nowrap;
}
.btn {
  height: 28px; padding: 0 10px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  color: var(--bg); font-size: 12px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn:hover { background: rgba(255,255,255,.16); }
.btn.danger { background: var(--err); border-color: var(--err); }
.divider { width: 1px; height: 20px; background: rgba(255,255,255,.16); }
.x {
  background: transparent; border: 0;
  color: rgba(255,255,255,.6); width: 24px; height: 24px;
  border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
}
.x:hover { background: rgba(255,255,255,.08); color: var(--bg); }

@keyframes rise { from { opacity: 0; transform: translate(-50%, 8px); } }
</style>
