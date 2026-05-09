<script setup lang="ts">
import type { Transaction } from '~/types/transaction'

const props = defineProps<{ tx: Transaction }>()
const emit = defineEmits<{
  close: []
  confirm: [tx: Transaction, opts: { amount: number; reason: string }]
}>()

const reason = ref('Customer requested refund')
const partial = ref(false)
const partialAmount = ref(props.tx.amount)

watch(() => props.tx, (t) => {
  reason.value = 'Customer requested refund'
  partial.value = false
  partialAmount.value = t.amount
}, { immediate: true })

const refundAmount = computed(() => partial.value ? partialAmount.value : props.tx.amount)

function fmtIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="modal-scrim" @click="emit('close')" />
    <div class="modal" role="dialog" aria-label="Refund">
      <div class="modal-head">
        <h3>Refund {{ tx.id }}</h3>
      </div>
      <div class="modal-body">
        <p>
          You're issuing a refund to <strong style="color: var(--fg)">{{ tx.customerName }}</strong>.
          The amount will return to their original payment method within 3–7 business days.
        </p>

        <div class="refund-summary">
          <div class="row-kv">
            <span>Original amount</span>
            <span class="tnum">Rp {{ fmtIDR(tx.amount) }}</span>
          </div>
          <div class="row-kv">
            <span>Refund amount</span>
            <span class="tnum" style="font-weight: 600">Rp {{ fmtIDR(refundAmount) }}</span>
          </div>
        </div>

        <div class="radio-group">
          <label>
            <input type="radio" name="r-amt" :checked="!partial" @change="partial = false" />
            Full refund
          </label>
          <label>
            <input type="radio" name="r-amt" :checked="partial" @change="partial = true" />
            Partial
          </label>
          <input
            v-if="partial"
            class="txt tnum"
            type="number"
            :min="1"
            :max="tx.amount"
            :value="partialAmount"
            @input="partialAmount = Math.min(tx.amount, Math.max(0, +($event.target as HTMLInputElement).value))"
            style="width: 120px"
          />
        </div>

        <div class="field-label">Reason</div>
        <textarea rows="3" v-model="reason" />
      </div>
      <div class="modal-foot">
        <button class="btn ghost" @click="emit('close')">Cancel</button>
        <button class="btn danger" @click="emit('confirm', tx, { amount: refundAmount, reason })">
          Refund Rp {{ fmtIDR(refundAmount) }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  position: fixed; inset: 0; background: rgba(15,16,20,.32);
  z-index: 80; backdrop-filter: blur(2px);
  animation: fade 140ms ease-out;
}
.modal {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  z-index: 81; width: min(440px, 92vw);
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-pop);
  animation: pop 160ms cubic-bezier(.2,.8,.2,1); overflow: hidden;
}
.modal-head { padding: 18px 20px 4px; }
.modal-head h3 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.015em; color: var(--fg); }
.modal-body { padding: 8px 20px 18px; font-size: 13.5px; color: var(--fg-muted); line-height: 1.5; }
.modal-body p { margin: 0 0 8px; }
.modal-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 16px; background: var(--surface); border-top: 1px solid var(--border);
}
.refund-summary {
  margin: 8px 0 12px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 14px;
  font-size: 13px; color: var(--fg); display: flex; flex-direction: column; gap: 4px;
}
.row-kv { display: flex; justify-content: space-between; }
.row-kv span:first-child { color: var(--fg-muted); }

.radio-group {
  display: flex; gap: 12px; align-items: center; margin: 0 0 12px;
}
.radio-group label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--fg);
}

textarea, .txt {
  width: 100%; box-sizing: border-box;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 10px;
  font-size: 13px; outline: none; color: var(--fg);
  resize: vertical; font-family: var(--font-sans);
}
textarea:focus, .txt:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.field-label { font-size: 12px; color: var(--fg-muted); margin: 0 0 4px; }

.btn {
  height: 32px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--fg); font-size: 13px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn.ghost { border-color: transparent; background: transparent; }
.btn.ghost:hover { background: var(--surface-2); }
.btn.danger { background: var(--err); color: white; border-color: var(--err); }
.btn.danger:hover { background: color-mix(in oklch, var(--err) 90%, #000); }

@keyframes fade { from { opacity: 0; } }
@keyframes pop  { from { opacity: 0; transform: translate(-50%, -46%) scale(.96); } }
</style>
