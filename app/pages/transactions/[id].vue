
<script setup lang="ts">
import { useRoute } from 'nuxt/app'
import { computed } from 'vue'
import { transactions } from '../../data/transactions'

const route = useRoute()

const transaction = computed(() => {
  return transactions.find((item) => item.id === route.params.id)
})

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount ?? 0)
</script>

<template>
  <v-container class="py-8">
    <v-btn
      variant="text"
      to="/dashboard/transactions"
      class="mb-4"
    >
      Back to transactions
    </v-btn>

    <v-card v-if="transaction" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold">
            Transaction {{ transaction.id }}
          </h1>
          <p class="text-medium-emphasis">
            Transaction detail preview page
          </p>
        </div>

        <StatusChip :status="transaction.status" />
      </div>

      <v-divider class="mb-4" />

      <v-row>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis">Customer Name</p>
          <p class="text-body-1 mb-4">{{ transaction.customerName }}</p>

          <p class="text-caption text-medium-emphasis">Email</p>
          <p class="text-body-1 mb-4">{{ transaction.email }}</p>

          <p class="text-caption text-medium-emphasis">Payment Method</p>
          <p class="text-body-1 mb-4">{{ transaction.paymentMethod }}</p>
        </v-col>

        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis">Amount</p>
          <p class="text-body-1 mb-4">{{ formatCurrency(transaction.amount) }}</p>

          <p class="text-caption text-medium-emphasis">Created At</p>
          <p class="text-body-1 mb-4">{{ transaction.createdAt }}</p>

          <p class="text-caption text-medium-emphasis">Refundable</p>
          <p class="text-body-1 mb-4">
            {{ transaction.refundable ? 'Yes' : 'No' }}
          </p>
        </v-col>
      </v-row>
    </v-card>

    <v-alert v-else type="error" variant="tonal">
      Transaction not found.
    </v-alert>
  </v-container>
</template>