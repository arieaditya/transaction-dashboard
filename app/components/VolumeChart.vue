<script setup lang="ts">
const props = defineProps<{
  data: Array<{
    label: string
    paid: number
    pending: number
    refunded: number
    failed: number
  }>
  accentColor?: string
}>()

const W = 1100, H = 140, PL = 40, PR = 8, PT = 8, PB = 22
const innerW = W - PL - PR
const innerH = H - PT - PB

const niceMax = computed(() => {
  const max = Math.max(...props.data.map(d => d.paid + d.pending + d.refunded + d.failed))
  return Math.ceil(max / 500_000) * 500_000
})

const barW = computed(() => (innerW / props.data.length) * 0.62)
const step = computed(() => innerW / props.data.length)

function barX(i: number) {
  return PL + i * step.value + (step.value - barW.value) / 2
}

const gridLines = computed(() => {
  return [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: PT + innerH * (1 - p),
    val: p,
    label: p === 0 ? '0' : `${(niceMax.value * p / 1_000_000).toFixed(0)}M`,
  }))
})

type DataRow = typeof props.data[0]

function stackSegments(d: DataRow) {
  let yCursor = PT + innerH
  const keys = [
    { key: 'paid',     color: props.accentColor || 'var(--accent)' },
    { key: 'pending',  color: 'var(--warn)' },
    { key: 'refunded', color: 'var(--info)' },
    { key: 'failed',   color: 'var(--err)' },
  ]
  return keys.map(s => {
    const v = d[s.key as keyof DataRow] as number
    const h = (v / niceMax.value) * innerH
    yCursor -= h
    return { key: s.key, y: yCursor, h, color: s.color }
  })
}
</script>

<template>
  <div class="chart-card">
    <div class="chart-head">
      <div class="chart-title">Daily volume · last 14 days</div>
      <div class="chart-legend">
        <span><i :style="{ background: accentColor || 'var(--accent)' }" />Paid</span>
        <span><i style="background: var(--warn)" />Pending</span>
        <span><i style="background: var(--info)" />Refunded</span>
        <span><i style="background: var(--err)" />Failed</span>
      </div>
    </div>
    <svg class="svgchart" viewBox="0 0 1100 140" preserveAspectRatio="none">
      <g v-for="(p, pi) in gridLines" :key="pi">
        <line :x1="40" :x2="1092" :y1="p.y" :y2="p.y"
              stroke="var(--border)" stroke-width="1"
              :stroke-dasharray="p.val === 0 ? '0' : '2 3'" />
        <text :x="34" :y="p.y + 3" text-anchor="end" font-size="9"
              fill="var(--fg-faint)" :font-family="'var(--font-mono)'">
          {{ p.label }}
        </text>
      </g>

      <g v-for="(d, i) in data" :key="i">
        <rect v-for="s in stackSegments(d)" :key="s.key"
              :x="barX(i)" :y="s.y" :width="barW" :height="s.h"
              :fill="s.color" :opacity="i === data.length - 1 ? 1 : 0.92" />
        <text v-if="i % 2 === 0"
              :x="barX(i) + barW / 2" :y="134"
              text-anchor="middle" font-size="9.5"
              fill="var(--fg-faint)" :font-family="'var(--font-mono)'">
          {{ d.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px; margin-bottom: 14px;
}
.chart-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 10px;
}
.chart-title { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: var(--fg); }
.chart-legend { display: flex; gap: 14px; font-size: 11.5px; color: var(--fg-muted); }
.chart-legend i {
  width: 8px; height: 8px; border-radius: 2px;
  display: inline-block; margin-right: 5px; vertical-align: 1px;
}
.svgchart { width: 100%; height: 140px; display: block; overflow: visible; }
</style>
