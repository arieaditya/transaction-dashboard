<script setup lang="ts">
const props = defineProps<{
  data: number[]
  color?: string
  height?: number
  width?: number
}>()

const color = computed(() => props.color ?? 'var(--accent)')
const H = computed(() => props.height ?? 28)
const W = computed(() => props.width ?? 96)

const pathData = computed(() => {
  const data = props.data
  if (!data || data.length < 2) return { line: '', area: '', last: { x: 0, y: 0 } }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.15 || 1
  const lo = min - pad
  const hi = max + pad
  const w = W.value
  const h = H.value

  const xs = data.map((_, i) => (i / (data.length - 1)) * w)
  const ys = data.map(v => h - ((v - lo) / (hi - lo)) * h)

  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const last = { x: xs[xs.length - 1], y: ys[ys.length - 1] }

  return { line, area, last }
})

const gradId = computed(() => `spk-${Math.random().toString(36).slice(2, 8)}`)
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    :style="{ width: '100%', height: `${H}px`, display: 'block', overflow: 'visible' }"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.25" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="pathData.area" :fill="`url(#${gradId})`" />
    <path :d="pathData.line" fill="none" :stroke="color" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    <circle :cx="pathData.last.x" :cy="pathData.last.y" r="2" :fill="color" />
  </svg>
</template>
