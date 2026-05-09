<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import { deriveEvents, PAYMENT_METHOD_META } from '~/types/transaction'

const props = defineProps<{ tx: Transaction }>()
const emit = defineEmits<{
  close: []
  refund: [tx: Transaction]
}>()

const net = computed(() => props.tx.amount - (props.tx.fee ?? 0))

const events = computed(() => deriveEvents(props.tx))

function fmtIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const riskColor = (score: number) =>
  score < 20 ? 'var(--ok)' : score < 60 ? 'var(--warn)' : 'var(--err)'
const riskLabel = (score: number) =>
  score < 20 ? 'Low' : score < 60 ? 'Medium' : 'High'

const methodMeta = computed(() => PAYMENT_METHOD_META[props.tx.paymentMethod])

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="scrim" @click="emit('close')" />
    <div class="slideover" role="dialog" aria-label="Transaction detail">
      <div class="so-head">
        <button class="icon-btn" @click="emit('close')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="m4 4 8 8M12 4l-8 8"/>
          </svg>
        </button>
        <div class="id mono">{{ tx.id }}</div>
        <button class="btn ghost sm">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3h4v4M13 3 7 9M11 9v4H3V5h4"/>
          </svg>
          Open page
        </button>
      </div>

      <div class="so-body">
        <div class="so-amount">
          <span class="currency">Rp</span>{{ fmtIDR(tx.amount) }}
        </div>
        <div class="so-meta">
          <StatusChip :status="tx.status" />
          <span class="sep">·</span>
          <span>{{ fmtDate(tx.createdAt) }} at {{ fmtTime(tx.createdAt) }} WIB</span>
        </div>

        <div class="so-section">
          <h3>Customer</h3>
          <dl class="kv">
            <dt>Name</dt><dd class="left">{{ tx.customerName }}</dd>
            <dt>Email</dt><dd class="left">{{ tx.email }}</dd>
            <dt>City</dt><dd class="left">{{ tx.city || '—' }}, Indonesia</dd>
            <dt v-if="tx.risk !== undefined">Risk score</dt>
            <dd v-if="tx.risk !== undefined" class="left">
              <div class="risk-bar-wrap">
                <div class="risk-track">
                  <div class="risk-fill" :style="{ width: `${tx.risk}%`, background: riskColor(tx.risk) }" />
                </div>
                <span class="mono" :style="{ fontSize: '12px', color: riskColor(tx.risk), fontWeight: 500 }">
                  {{ riskLabel(tx.risk) }}
                </span>
                <span class="mono" style="font-size: 11px; color: var(--fg-faint)">{{ tx.risk }}</span>
              </div>
            </dd>
          </dl>
        </div>

        <div class="so-section">
          <h3>Payment</h3>
          <dl class="kv">
            <dt>Method</dt>
            <dd class="left">
              <div class="method-cell">
                <span :class="['method-icon', tx.paymentMethod]">{{ methodMeta.short }}</span>
                <div class="method-text">
                  <div>{{ methodMeta.label }}</div>
                  <div style="color: var(--fg-faint); font-size: 11px;">{{ methodMeta.group }}</div>
                </div>
              </div>
            </dd>
            <dt>Channel</dt><dd class="left">{{ tx.channel || 'Checkout' }}</dd>
            <dt>Amount</dt><dd>Rp {{ fmtIDR(tx.amount) }}</dd>
            <dt>Processing fee</dt>
            <dd style="color: var(--fg-muted)">− Rp {{ fmtIDR(tx.fee ?? 0) }}</dd>
            <dt class="net-dt">Net to balance</dt>
            <dd class="net-dd">Rp {{ fmtIDR(net) }}</dd>
          </dl>
        </div>

        <div class="so-section">
          <h3>Timeline</h3>
          <div class="tl">
            <div v-for="(ev, i) in events" :key="i" class="tl-item">
              <span :class="['tl-dot', ev.kind === 'ok' || ev.kind === 'created' || ev.kind === 'attempt' ? 'ok' : ev.kind]" />
              <div class="tl-label">{{ ev.label }}</div>
              <div class="tl-time">{{ fmtDate(ev.at) }} · {{ fmtTime(ev.at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="so-foot">
        <button class="btn ghost">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.5 2.5h9v11l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1Z"/>
            <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>
          </svg>
          Receipt
        </button>
        <button class="btn ghost">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3.5" width="12" height="9" rx="1.5"/>
            <path d="m2.5 4.5 5.5 4 5.5-4"/>
          </svg>
          Email customer
        </button>
        <div style="flex: 1" />
        <button
          class="btn"
          :disabled="!tx.refundable"
          :style="tx.refundable ? { color: 'var(--err)', borderColor: 'var(--err)' } : {}"
          @click="emit('refund', tx)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9a5 5 0 1 0 1.5-3.5L3 7M3 3v4h4"/>
          </svg>
          Refund
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed; inset: 0; z-index: 70;
  background: rgba(15,16,20,.18);
  backdrop-filter: blur(2px);
  animation: fade 160ms ease-out;
}
.slideover {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: min(560px, 92vw);
  background: var(--bg); border-left: 1px solid var(--border);
  z-index: 71;
  display: flex; flex-direction: column;
  animation: slidein 220ms cubic-bezier(.2,.8,.2,1);
  box-shadow: var(--shadow-pop);
}
.so-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.so-head .id { flex: 1; font-size: 13px; }
.so-body { flex: 1; overflow: auto; padding: 18px; }
.so-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 18px; border-top: 1px solid var(--border);
  background: var(--surface);
}
.so-amount {
  font-size: 32px; font-weight: 600; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; line-height: 1.1; margin-bottom: 4px;
  color: var(--fg);
}
.so-amount .currency { color: var(--fg-faint); font-weight: 500; font-size: 17px; margin-right: 4px; }
.so-meta { color: var(--fg-muted); font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.so-meta .sep { color: var(--fg-faint); }
.so-section { margin-top: 22px; }
.so-section h3 {
  font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--fg-muted);
  margin: 0 0 8px;
}
.kv {
  display: grid; grid-template-columns: 130px 1fr; gap: 4px 16px;
  font-size: 13px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 14px;
}
.kv dt { color: var(--fg-muted); padding: 5px 0; }
.kv dd { margin: 0; padding: 5px 0; font-variant-numeric: tabular-nums; text-align: right; }
.kv dd.left { text-align: left; }
.net-dt { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px; color: var(--fg-muted); padding-bottom: 5px; }
.net-dd { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px; font-weight: 600; text-align: right; padding-bottom: 5px; }

.tl { padding-left: 4px; }
.tl-item { position: relative; padding: 0 0 16px 22px; font-size: 13px; }
.tl-item:last-child { padding-bottom: 0; }
.tl-item::before {
  content: ""; position: absolute; left: 5px; top: 16px; bottom: -4px;
  width: 1px; background: var(--border);
}
.tl-item:last-child::before { display: none; }
.tl-dot {
  position: absolute; left: 0; top: 4px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--surface); border: 2px solid var(--fg-faint);
}
.tl-dot.ok     { border-color: var(--ok); }
.tl-dot.err    { border-color: var(--err); }
.tl-dot.wait   { border-color: var(--warn); }
.tl-dot.refund { border-color: var(--info); }
.tl-label { font-weight: 500; color: var(--fg); }
.tl-time  { color: var(--fg-faint); font-size: 12px; margin-top: 1px; font-variant-numeric: tabular-nums; }

.risk-bar-wrap { display: flex; align-items: center; gap: 8px; }
.risk-track {
  flex: 1; max-width: 140px; height: 6px;
  background: var(--surface-2); border-radius: 3px; overflow: hidden;
}
.risk-fill { height: 100%; border-radius: 3px; }

.method-cell { display: flex; align-items: center; gap: 8px; }
.method-icon {
  width: 26px; height: 18px; border-radius: 4px;
  background: var(--surface-2); border: 1px solid var(--border);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em;
  color: var(--fg-muted);
}
.method-icon.QRIS    { background: oklch(0.96 0.04 270); color: oklch(0.42 0.14 270); border-color: oklch(0.88 0.06 270); }
.method-icon.VA_BCA  { background: oklch(0.96 0.04 200); color: oklch(0.42 0.13 240); border-color: oklch(0.88 0.06 230); }
.method-icon.CARD    { background: oklch(0.96 0.04 30);  color: oklch(0.42 0.14 30);  border-color: oklch(0.88 0.06 30); }
.method-icon.EWALLET { background: oklch(0.96 0.04 150); color: oklch(0.42 0.13 150); border-color: oklch(0.88 0.06 150); }

.icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--fg-muted);
}
.icon-btn:hover { background: var(--surface-2); color: var(--fg); }

.btn {
  height: 32px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--fg); font-size: 13px; font-weight: 500; letter-spacing: -0.005em;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn.ghost { border-color: transparent; background: transparent; }
.btn.ghost:hover { background: var(--surface-2); }
.btn.sm { height: 26px; padding: 0 8px; font-size: 12px; }
.btn[disabled] { opacity: 0.4; pointer-events: none; }

@keyframes fade    { from { opacity: 0; } }
@keyframes slidein { from { transform: translateX(20px); opacity: 0; } }
</style>
