<script setup lang="ts">
import type { TransactionStatus } from '~/types/transaction'
defineProps<{ status: TransactionStatus }>()
</script>

<template>
  <span :class="['status', status]">
    <span class="dot" />
    {{ status.charAt(0) + status.slice(1).toLowerCase() }}
  </span>
</template>

<style scoped>
.status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 8px 2px 7px;
  border-radius: 999px;
  font-size: 11.5px; font-weight: 500;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
  white-space: nowrap;
}
.dot { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 6px; }

.PAID     { color: var(--ok);   background: var(--ok-soft);   }
.PAID .dot     { background: var(--ok);   box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 22%, transparent); }
.PENDING  { color: var(--warn); background: var(--warn-soft); }
.PENDING .dot  { background: var(--warn); animation: pulse 1.6s ease-in-out infinite; }
.FAILED   { color: var(--err);  background: var(--err-soft);  }
.FAILED .dot   { background: var(--err); }
.REFUNDED { color: var(--info); background: var(--info-soft); }
.REFUNDED .dot { background: var(--info); }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--warn) 35%, transparent); }
  50%       { box-shadow: 0 0 0 4px color-mix(in srgb, var(--warn) 0%, transparent); }
}
</style>
