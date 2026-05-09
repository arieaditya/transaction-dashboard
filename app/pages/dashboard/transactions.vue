<script setup lang="ts">
import type { Transaction, TransactionStatus, PaymentMethod } from '~/types/transaction'
import { PAYMENT_METHOD_META } from '~/types/transaction'

// ─── Data ────────────────────────────────────────────────────────────────────

// Fetch without server:false so Nuxt SSR can populate data from the API server.
// With await, the page waits for the fetch before rendering (no flash of empty content).
const {
  data: apiData,
  pending,
  error,
  refresh,
} = await useFetch<Transaction[]>('http://localhost:3001/transactions', {
  default: () => [] as Transaction[],
})

// Drive items directly from the API response. When apiData updates (e.g. after
// refresh()), items stays in sync. Refund operations update items optimistically
// so the UI reflects the new status before the next full refresh.
const items = computed({
  get: () => apiData.value ?? [],
  set: (v) => { apiData.value = v },
})

// ─── Filters ─────────────────────────────────────────────────────────────────

const search = ref('')
const activeStatus = ref<'ALL' | TransactionStatus>('ALL')
const activeMethod = ref<'ALL' | PaymentMethod>('ALL')
const dateRange = ref('Last 14 days')

const statusOptions: Array<{ v: 'ALL' | TransactionStatus; label: string }> = [
  { v: 'ALL',      label: 'All' },
  { v: 'PAID',     label: 'Paid' },
  { v: 'PENDING',  label: 'Pending' },
  { v: 'FAILED',   label: 'Failed' },
  { v: 'REFUNDED', label: 'Refunded' },
]

const counts = computed(() => {
  const c = { all: items.value.length, PAID: 0, PENDING: 0, FAILED: 0, REFUNDED: 0 }
  items.value.forEach(i => { c[i.status as TransactionStatus]++ })
  return c
})

const filtered = computed(() => {
  const k = search.value.toLowerCase()
  return items.value.filter(it => {
    const ms = !k || it.id.toLowerCase().includes(k) || it.customerName.toLowerCase().includes(k) || it.email.toLowerCase().includes(k)
    const mst = activeStatus.value === 'ALL' || it.status === activeStatus.value
    const mm = activeMethod.value === 'ALL' || it.paymentMethod === activeMethod.value
    return ms && mst && mm
  })
})

// ─── Pagination ──────────────────────────────────────────────────────────────

const perPage = 8
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const pageItems = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

watch(pageCount, (c) => { if (page.value > c) page.value = c })

function setSearch(v: string) { search.value = v; page.value = 1 }
function setStatus(v: typeof activeStatus.value) { activeStatus.value = v; page.value = 1 }
function setMethod(v: typeof activeMethod.value) { activeMethod.value = v; page.value = 1 }

// ─── Selection ───────────────────────────────────────────────────────────────

const selected = ref(new Set<string>())

const allSelectedOnPage = computed(() =>
  pageItems.value.length > 0 && pageItems.value.every(i => selected.value.has(i.id))
)
const someSelectedOnPage = computed(() =>
  pageItems.value.some(i => selected.value.has(i.id)) && !allSelectedOnPage.value
)

function toggleSelect(id: string) {
  const n = new Set(selected.value)
  n.has(id) ? n.delete(id) : n.add(id)
  selected.value = n
}
function toggleSelectAll() {
  const n = new Set(selected.value)
  if (allSelectedOnPage.value) pageItems.value.forEach(i => n.delete(i.id))
  else pageItems.value.forEach(i => n.add(i.id))
  selected.value = n
}
function clearSelection() { selected.value = new Set() }

// ─── Slide-over ──────────────────────────────────────────────────────────────

const openTx = ref<Transaction | null>(null)

// ─── Refund ──────────────────────────────────────────────────────────────────

const refundTx = ref<Transaction | null>(null)
const toast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

async function onConfirmRefund(tx: Transaction, opts: { amount: number; reason: string }) {
  // Optimistic update so the UI reflects the change immediately
  apiData.value = (apiData.value ?? []).map(i =>
    i.id === tx.id ? { ...i, status: 'REFUNDED' as TransactionStatus, refundable: false } : i
  )
  if (openTx.value?.id === tx.id) openTx.value = { ...openTx.value, status: 'REFUNDED', refundable: false }
  refundTx.value = null

  try {
    await $fetch(`http://localhost:3001/transactions/${tx.id}/refund`, {
      method: 'POST',
      body: { reason: opts.reason },
    })
    await refresh()
  } catch {
    // API persisted failure — keep the optimistic state; next refresh will correct
  }

  const msg = `Refund of Rp ${fmtIDR(opts.amount)} issued for ${tx.id}`
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

const SERIES = {
  volume:   [4.2, 5.1, 4.8, 6.0, 5.4, 6.7, 7.1, 6.4, 7.8, 8.2, 7.6, 8.9, 9.4, 9.1].map(v => v * 1_000_000),
  paid:     [12, 14, 13, 17, 15, 19, 21, 18, 22, 24, 22, 25, 27, 26],
  refunded: [1, 0, 1, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 2],
}

const kpis = computed(() => {
  const all = items.value
  const paid = all.filter(i => i.status === 'PAID').length
  const refunded = all.filter(i => i.status === 'REFUNDED').length
  const processed = all.filter(i => i.status === 'PAID' || i.status === 'REFUNDED').reduce((s, i) => s + i.amount, 0)
  return [
    { label: 'Total transactions', value: all.length.toString(),                          sub: 'All recorded payment intents',     delta: 8.4,  series: SERIES.paid,     color: 'var(--accent)' },
    { label: 'Paid',               value: paid.toString(),                                sub: 'Successful captures',              delta: 12.6, series: SERIES.paid,     color: 'var(--ok)' },
    { label: 'Refunded',           value: refunded.toString(),                            sub: 'Returned to customers',            delta: -2.3, series: SERIES.refunded, color: 'var(--info)' },
    { label: 'Processed volume',   value: (processed / 1_000_000).toFixed(2) + 'M', currency: true, sub: 'Paid + refunded · 14d trend', delta: 14.9, series: SERIES.volume, color: 'var(--accent)' },
  ]
})

// ─── Chart data ──────────────────────────────────────────────────────────────

const CHART_DATA = (() => {
  const seriesPaid     = [12, 14, 13, 17, 15, 19, 21, 18, 22, 24, 22, 25, 27, 26]
  const seriesRefunded = [1, 0, 1, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 2]
  const seriesFailed   = [3, 2, 4, 2, 3, 3, 2, 5, 4, 3, 2, 3, 4, 3]
  const days = 14
  return Array.from({ length: days }, (_, i) => ({
    label: `D-${days - 1 - i}`,
    paid:     seriesPaid[i] * 35000,
    pending:  seriesPaid[i] * 0.15 * 35000,
    refunded: seriesRefunded[i] * 180000,
    failed:   seriesFailed[i] * 220000,
  }))
})()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Search input ref (⌘K) ───────────────────────────────────────────────────

const searchInput = ref<HTMLInputElement | null>(null)

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="page">
    <!-- Page header -->
    <div class="page-head">
      <div class="page-title">
        <h1>Transactions</h1>
        <p>Monitor payment activity, inspect transaction details, and handle refund requests across all your channels.</p>
      </div>
      <div class="page-head-actions">
        <button class="btn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 4h12M4 8h8M6 12h4"/>
          </svg>
          More filters
        </button>
        <button class="btn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2v8m0 0 3-3m-3 3-3-3"/><path d="M3 13h10"/>
          </svg>
          Export CSV
        </button>
        <button class="btn accent">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M8 3v10M3 8h10"/>
          </svg>
          New payment
        </button>
      </div>
    </div>

    <!-- KPI strip -->
    <div class="kpis">
      <div v-for="(kpi, i) in kpis" :key="i" class="kpi">
        <div class="kpi-head">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div :class="['kpi-delta', kpi.delta >= 0 ? 'up' : 'down']">
            <svg v-if="kpi.delta >= 0" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 3-3 3 3"/></svg>
            <svg v-else width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 5 3 3 3-3"/></svg>
            {{ Math.abs(kpi.delta).toFixed(1) }}%
          </div>
        </div>
        <div class="kpi-value">
          <span v-if="kpi.currency" class="currency">Rp</span>{{ kpi.value }}
        </div>
        <div class="kpi-foot">
          <div class="kpi-sub">{{ kpi.sub }}</div>
          <div style="width: 96px">
            <Sparkline :data="kpi.series" :color="kpi.color" />
          </div>
        </div>
      </div>
    </div>

    <!-- Volume chart -->
    <VolumeChart :data="CHART_DATA" />

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--fg-faint)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex: 0 0 14px">
          <circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/>
        </svg>
        <input
          ref="searchInput"
          :value="search"
          @input="setSearch(($event.target as HTMLInputElement).value)"
          placeholder="Search by ID, customer, email…"
        />
      </div>

      <div class="chip-group" role="tablist">
        <button
          v-for="opt in statusOptions"
          :key="opt.v"
          :class="['chip', activeStatus === opt.v ? 'active' : '']"
          @click="setStatus(opt.v)"
        >
          <span
            v-if="opt.v !== 'ALL'"
            :style="{
              width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
              background: opt.v === 'PAID' ? 'var(--ok)' : opt.v === 'PENDING' ? 'var(--warn)' : opt.v === 'FAILED' ? 'var(--err)' : 'var(--info)'
            }"
          />
          {{ opt.label }}
          <span class="count">{{ opt.v === 'ALL' ? counts.all : counts[opt.v as TransactionStatus] }}</span>
        </button>
      </div>

      <div class="spacer" />

      <button class="daterange">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5 2v3M11 2v3"/>
        </svg>
        <span>{{ dateRange }}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="m4 6 4 4 4-4"/>
        </svg>
      </button>

      <div class="chip-group">
        <button
          v-for="m in (['ALL', 'QRIS', 'VA_BCA', 'CARD', 'EWALLET'] as const)"
          :key="m"
          :class="['chip', activeMethod === m ? 'active' : '']"
          @click="setMethod(m)"
        >
          {{ m === 'ALL' ? 'All methods' : PAYMENT_METHOD_META[m as PaymentMethod]?.label || m }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-head">
        <div @click="toggleSelectAll" style="cursor: default">
          <button :class="['cb', allSelectedOnPage ? 'on' : '', someSelectedOnPage ? 'partial' : '']"
                  :aria-checked="allSelectedOnPage" role="checkbox">
            <svg v-if="someSelectedOnPage" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
            <svg v-else-if="allSelectedOnPage" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>
          </button>
        </div>
        <div>Transaction</div>
        <div>Customer</div>
        <div>Amount</div>
        <div>Method</div>
        <div>Status</div>
        <div>Time</div>
        <div></div>
      </div>

      <div v-if="pending" class="empty">
        <div style="font-size: 28px">⏳</div>
        <h4>Loading transactions…</h4>
      </div>

      <template v-else-if="pageItems.length">
        <div
          v-for="tx in pageItems"
          :key="tx.id"
          :class="['row', selected.has(tx.id) ? 'selected' : '']"
          @click="openTx = tx"
        >
          <div @click.stop>
            <button
              :class="['cb', selected.has(tx.id) ? 'on' : '']"
              @click="toggleSelect(tx.id)"
              role="checkbox"
              :aria-checked="selected.has(tx.id)"
            >
              <svg v-if="selected.has(tx.id)" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>
            </button>
          </div>

          <div class="col id">
            <div><span class="prefix">TXN-</span>{{ tx.id.replace('TXN-', '') }}</div>
          </div>

          <div class="col cust">
            <div class="name">{{ tx.customerName }}</div>
            <div class="secondary">{{ tx.email }}<span v-if="tx.city"> · {{ tx.city }}</span></div>
          </div>

          <div class="col amt">
            <div><span class="currency">Rp</span>{{ fmtIDR(tx.amount) }}</div>
            <div class="secondary">fee Rp{{ fmtIDR(tx.fee ?? 0) }}</div>
          </div>

          <div class="col col-method">
            <div class="method-cell">
              <span :class="['method-icon', tx.paymentMethod]">{{ PAYMENT_METHOD_META[tx.paymentMethod].short }}</span>
              <div class="method-text">
                <div class="label">{{ PAYMENT_METHOD_META[tx.paymentMethod].label }}</div>
                <div class="secondary">{{ PAYMENT_METHOD_META[tx.paymentMethod].group }}</div>
              </div>
            </div>
          </div>

          <div class="col col-status">
            <StatusChip :status="tx.status" />
          </div>

          <div class="col time">
            <div class="primary">{{ fmtTime(tx.createdAt) }}</div>
            <div class="secondary">{{ relTime(tx.createdAt) }}</div>
          </div>

          <div class="row-actions" @click.stop>
            <button v-if="tx.refundable" class="btn ghost sm" @click="refundTx = tx" title="Refund">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9a5 5 0 1 0 1.5-3.5L3 7M3 3v4h4"/>
              </svg>
            </button>
            <button v-else class="btn ghost sm" style="opacity: 0" disabled>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="3.5" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="12.5" cy="8" r="1.2"/>
              </svg>
            </button>
            <button class="btn ghost sm" @click="openTx = tx" title="Open">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 4 4 4-4 4"/>
              </svg>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="empty">
        <div style="font-size: 28px">🔎</div>
        <h4>No matching transactions</h4>
        <div>Try changing the search keyword or filters.</div>
      </div>

      <div class="table-foot">
        <div>
          Showing <strong class="tnum">{{ pageItems.length }}</strong> of
          <strong class="tnum">{{ filtered.length }}</strong> transactions
          <span v-if="filtered.length !== items.length" style="color: var(--fg-faint)">
            · filtered from {{ items.length }}
          </span>
        </div>
        <div class="pager">
          <button class="icon-btn" :disabled="page === 1" @click="page = 1" title="First">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m10 4-4 4 4 4"/></svg>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-left: -8px"><path d="m10 4-4 4 4 4"/></svg>
          </button>
          <button class="icon-btn" :disabled="page === 1" @click="page--" title="Previous">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m10 4-4 4 4 4"/></svg>
          </button>
          <button
            v-for="p in Math.min(pageCount, 5)"
            :key="p"
            :class="['page-pill', p === page ? 'active' : '']"
            @click="page = p"
            :style="{
              border: '1px solid',
              borderColor: p === page ? 'var(--border-strong)' : 'transparent',
              background: p === page ? 'var(--surface-2)' : 'transparent',
              color: p === page ? 'var(--fg)' : 'var(--fg-muted)',
            }"
          >{{ p }}</button>
          <button class="icon-btn" :disabled="page === pageCount" @click="page++" title="Next">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 4 4 4-4 4"/></svg>
          </button>
          <button class="icon-btn" :disabled="page === pageCount" @click="page = pageCount" title="Last">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 4 4 4-4 4"/></svg>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-left: -8px"><path d="m6 4 4 4-4 4"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Overlays -->
  <SlideOver
    v-if="openTx"
    :tx="openTx"
    @close="openTx = null"
    @refund="refundTx = $event"
  />

  <RefundModal
    v-if="refundTx"
    :tx="refundTx"
    @close="refundTx = null"
    @confirm="onConfirmRefund"
  />

  <BulkBar
    v-if="selected.size > 0"
    :count="selected.size"
    @clear="clearSelection"
  />

  <Teleport v-if="toast" to="body">
    <div class="toast">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="oklch(0.78 0.16 150)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3.5 8.5 3 3 6-7"/>
      </svg>
      {{ toast }}
    </div>
  </Teleport>
</template>

<style scoped>
.page { max-width: 1400px; margin: 0 auto; padding: 28px 24px 80px; }

.page-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 24px; margin-bottom: 22px;
}
.page-title h1 {
  font-size: 28px; font-weight: 600; letter-spacing: -0.025em;
  margin: 0 0 6px; color: var(--fg);
}
.page-title p { color: var(--fg-muted); font-size: 13.5px; margin: 0; max-width: 580px; line-height: 1.45; }
.page-head-actions { display: flex; gap: 8px; align-items: center; }

/* Buttons */
.btn {
  height: 32px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--fg); font-size: 13px; font-weight: 500; letter-spacing: -0.005em;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn:hover { border-color: var(--border-strong); }
.btn.ghost { border-color: transparent; background: transparent; }
.btn.ghost:hover { background: var(--surface-2); }
.btn.accent { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.btn.accent:hover { background: color-mix(in oklch, var(--accent) 88%, #000); }
.btn.sm { height: 26px; padding: 0 8px; font-size: 12px; }
.btn[disabled] { opacity: 0.4; pointer-events: none; }

/* KPI strip */
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.kpi {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 16px 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.kpi-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kpi-label { color: var(--fg-muted); font-size: 12px; font-weight: 500; letter-spacing: -0.005em; }
.kpi-delta {
  font-size: 11px; font-weight: 500;
  padding: 1px 6px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 3px;
  font-variant-numeric: tabular-nums;
}
.kpi-delta.up   { color: var(--ok);  background: var(--ok-soft); }
.kpi-delta.down { color: var(--err); background: var(--err-soft); }
.kpi-value {
  font-size: 24px; font-weight: 600; letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums; line-height: 1.1; color: var(--fg);
}
.kpi-value .currency { color: var(--fg-faint); font-weight: 500; font-size: 14px; margin-right: 3px; }
.kpi-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 2px; }
.kpi-sub { color: var(--fg-faint); font-size: 11.5px; }

/* Toolbar */
.toolbar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); margin-bottom: 14px;
}
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  flex: 1; min-width: 200px; max-width: 320px;
  height: 30px; padding: 0 10px;
  background: var(--surface-2); border: 1px solid transparent;
  border-radius: 8px; color: var(--fg);
}
.search-wrap:focus-within { border-color: var(--accent); background: var(--surface); }
.search-wrap input { flex: 1; background: transparent; border: 0; outline: none; font-size: 13px; color: var(--fg); }
.search-wrap input::placeholder { color: var(--fg-faint); }

.chip-group { display: inline-flex; gap: 0; padding: 2px; background: var(--surface-2); border-radius: 8px; }
.chip {
  padding: 4px 10px; border: 0; background: transparent;
  font-size: 12px; font-weight: 500; color: var(--fg-muted);
  border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;
}
.chip:hover { color: var(--fg); }
.chip.active { background: var(--surface); color: var(--fg); box-shadow: var(--shadow-sm); }
.chip .count { color: var(--fg-faint); font-variant-numeric: tabular-nums; font-size: 11px; }
.chip.active .count { color: var(--fg-muted); }

.daterange {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 10px; border-radius: 8px;
  background: var(--surface-2); font-size: 12px; color: var(--fg-muted);
  border: 1px solid transparent;
}
.daterange:hover { color: var(--fg); }
.spacer { flex: 1; }

/* Table */
.table-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
}
.table-head {
  display: grid;
  grid-template-columns: 32px minmax(150px, 1.1fr) minmax(180px, 1.8fr) 120px 130px 130px 110px 64px;
  padding: 0 14px; height: 36px; align-items: center;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--fg-faint);
  position: sticky; top: 0px; z-index: 5;
}
.table-head .right { text-align: right; }

.row {
  display: grid;
  grid-template-columns: 32px minmax(150px, 1.1fr) minmax(180px, 1.8fr) 120px 130px 130px 110px 64px;
  align-items: center; padding: 0 14px;
  height: var(--row-h);
  border-bottom: 1px solid var(--border);
  font-size: 13px; cursor: default;
  transition: background 80ms;
}
.row:last-child { border-bottom: 0; }
.row:hover { background: var(--surface-2); }
.row.selected { background: var(--accent-soft); }
.row .col { min-width: 0; overflow: hidden; }
.row .right { text-align: right; }

.id { font-family: var(--font-mono); font-size: 12px; color: var(--fg); }
.id .prefix { color: var(--fg-faint); }

.cust .name { font-weight: 500; color: var(--fg); }
.cust .secondary { color: var(--fg-muted); font-size: 12px; margin-top: 1px; }

.amt { font-variant-numeric: tabular-nums; font-weight: 500; }
.amt .currency { color: var(--fg-faint); font-weight: 400; margin-right: 2px; }
.amt > div:first-child { color: var(--fg); }
.amt > div:first-child { margin-bottom: 4px; }
.amt .secondary { color: var(--fg-faint); font-size: 11.5px; font-weight: 400; }

.method-cell { display: flex; align-items: center; gap: 8px; }
.method-icon {
  width: 26px; height: 18px; border-radius: 4px;
  background: var(--surface-2); border: 1px solid var(--border);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em; color: var(--fg-muted);
  flex: 0 0 26px;
}
.method-icon.QRIS    { background: oklch(0.96 0.04 270); color: oklch(0.42 0.14 270); border-color: oklch(0.88 0.06 270); }
.method-icon.VA_BCA  { background: oklch(0.96 0.04 200); color: oklch(0.42 0.13 240); border-color: oklch(0.88 0.06 230); }
.method-icon.CARD    { background: oklch(0.96 0.04 30);  color: oklch(0.42 0.14 30);  border-color: oklch(0.88 0.06 30); }
.method-icon.EWALLET { background: oklch(0.96 0.04 150); color: oklch(0.42 0.13 150); border-color: oklch(0.88 0.06 150); }

.method-text .label { font-size: 12.5px; color: var(--fg); }
.method-text .secondary { color: var(--fg-faint); font-size: 11px; }

.time .primary   { font-variant-numeric: tabular-nums; font-size: 12.5px; color: var(--fg); }
.time .secondary { color: var(--fg-faint); font-size: 11.5px; }

.row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 2px; }

/* Checkbox */
.cb {
  width: 16px; height: 16px;
  border: 1px solid var(--border-strong); border-radius: 4px;
  background: var(--surface);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--accent-fg);
}
.cb.on, .cb.partial { background: var(--accent); border-color: var(--accent); }

/* Table footer */
.table-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-top: 1px solid var(--border);
  font-size: 12px; color: var(--fg-muted);
}
.pager { display: inline-flex; align-items: center; gap: 4px; }
.icon-btn {
  width: 26px; height: 26px; border-radius: 6px; border: 0; background: transparent;
  display: inline-flex; align-items: center; justify-content: center; color: var(--fg-muted);
}
.icon-btn:hover { background: var(--surface-2); color: var(--fg); }
.icon-btn[disabled] { opacity: 0.35; pointer-events: none; }
.page-pill {
  padding: 4px 8px; border-radius: 6px;
  font-variant-numeric: tabular-nums; font-size: 12px; cursor: default;
}

/* Empty state */
.empty {
  padding: 60px 16px; text-align: center; color: var(--fg-muted); font-size: 13px;
}
.empty h4 { margin: 12px 0 4px; color: var(--fg); font-size: 14px; font-weight: 600; }

/* Toast */
.toast {
  position: fixed; right: 22px; bottom: 22px; z-index: 90;
  background: var(--fg); color: var(--bg);
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; display: flex; align-items: center; gap: 8px;
  box-shadow: var(--shadow-pop);
  animation: rise-toast 180ms cubic-bezier(.2,.8,.2,1);
}

/* Responsive */
@media (max-width: 1100px) {
  .kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 760px) {
  .table-head { display: none; }
  .row {
    grid-template-columns: 32px 1fr auto;
    height: auto; padding: 12px 14px;
  }
  .col-method, .col-status { display: none; }
}
</style>
