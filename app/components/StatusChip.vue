<script setup lang="ts">
import type { TransactionStatus } from '../types/transaction'

const props = defineProps<{
  status: TransactionStatus
}>()

const colorMap: Record<TransactionStatus, string> = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  REFUNDED: 'info'
}
</script>

<template>
  <v-chip
    :color="colorMap[props.status]"
    size="small"
    variant="flat"
  >
    {{ props.status }}
  </v-chip>
</template>