<script setup lang="ts">
import { transactions } from '~/data/transactions'
import type { Transaction, TransactionStatus } from '~/types/transaction'

const search = ref('')
const selectedStatus = ref<'ALL' | TransactionStatus>('ALL')
const refundDialog = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')

const headers = [
  { title: 'Transaction ID', key: 'id' },
  { title: 'Customer', key: 'customerName' },
  { title: 'Amount', key: 'amount' },
  { title: 'Method', key: 'paymentMethod' },
  { title: 'Status', key: 'status' },
  { title: 'Created At', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const summary = computed(() => {
  const totalTransactions = transactions.length
  const paidTransactions = transactions.filter((item) => item.status === 'PAID').length
  const refundedTransactions = transactions.filter((item) => item.status === 'REFUNDED').length
  const totalProcessedAmount = transactions
    .filter((item) => item.status === 'PAID' || item.status === 'REFUNDED')
    .reduce((sum, item) => sum + item.amount, 0)

  return [
    {
      title: 'Total Transactions',
      value: totalTransactions.toString(),
      subtitle: 'All recorded transaction rows',
      icon: 'mdi-swap-horizontal',
      color: 'primary'
    },
    {
      title: 'Paid Transactions',
      value: paidTransactions.toString(),
      subtitle: 'Successful captured payments',
      icon: 'mdi-check-circle-outline',
      color: 'success'
    },
    {
      title: 'Refunded',
      value: refundedTransactions.toString(),
      subtitle: 'Transactions already refunded',
      icon: 'mdi-cash-refund',
      color: 'info'
    },
    {
      title: 'Processed Amount',
      value: formatCurrency(totalProcessedAmount),
      subtitle: 'Paid and refunded total volume',
      icon: 'mdi-cash-multiple',
      color: 'warning'
    }
  ]
})

const selectedMethod = ref<'ALL' | 'VA_BCA' | 'QRIS' | 'EWALLET' | 'CARD'>('ALL')
const methodOptions = ['ALL', 'VA_BCA', 'QRIS', 'EWALLET', 'CARD'] as const
const statusOptions = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'] as const

const filteredTransactions = computed(() => {
  return transactions.filter((item) => {
    const keyword = search.value.toLowerCase()

    const matchesSearch =
      item.id.toLowerCase().includes(keyword) ||
      item.customerName.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword)

    const matchesStatus =
      selectedStatus.value === 'ALL' || item.status === selectedStatus.value

    const matchesMethod =
      selectedMethod.value === 'ALL' || item.paymentMethod === selectedMethod.value

    return matchesSearch && matchesStatus && matchesMethod
  })
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount)

const openRefundDialog = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  refundDialog.value = true
}

const submitRefund = () => {
  refundDialog.value = false
  snackbarText.value = `Refund requested for ${selectedTransaction.value?.id}`
  snackbar.value = true
}

const hasActiveFilters = computed(() => {
  return search.value !== '' || selectedStatus.value !== 'ALL' || selectedMethod.value !== 'ALL'
})

</script>

<template>
  <v-container class="py-8">
    <PageHeader
      title="Transactions"
      subtitle="Monitor payment activity, inspect transaction details, and handle refund requests."
    >
      <template #default>
        <v-btn color="primary" prepend-icon="mdi-download">
          Export CSV
        </v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-2">
      <v-col
        v-for="item in summary"
        :key="item.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <v-card rounded="lg" class="pa-4 h-100">
          <div class="d-flex align-start justify-space-between mb-4">
            <div>
              <div class="text-overline text-medium-emphasis">
                {{ item.title }}
              </div>

              <div class="text-h5 font-weight-bold">
                {{ item.value }}
              </div>
            </div>

            <v-avatar :color="item.color" variant="tonal" size="40">
              <v-icon>{{ item.icon }}</v-icon>
            </v-avatar>
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ item.subtitle }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-4 mb-4" rounded="lg">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            label="Search by transaction ID or customer"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Filter by status"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="selectedMethod"
            :items="methodOptions"
            label="Filter by payment method"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="lg">
      <template v-if="filteredTransactions.length">
        <v-data-table
          :headers="headers"
          :items="filteredTransactions"
          :items-per-page="5"
        >
          <template #item.amount="{ item }">
            {{ formatCurrency(item.amount) }}
          </template>

          <template #item.status="{ item }">
            <StatusChip :status="item.status" />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-btn
                size="small"
                variant="text"
                :to="`/transactions/${item.id}`"
              >
                View
              </v-btn>

              <v-btn
                size="small"
                color="error"
                variant="tonal"
                :disabled="!item.refundable"
                @click="openRefundDialog(item)"
              >
                Refund
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </template>

      <EmptyState
        v-else
        :title="hasActiveFilters ? 'No matching transactions' : 'No transactions yet'"
        :subtitle="hasActiveFilters
          ? 'Try changing the search keyword, payment status, or payment method filter.'
          : 'Transactions will appear here once payment activity starts coming in.'"
      />
    </v-card>

    <v-dialog v-model="refundDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title>Request Refund</v-card-title>

        <v-card-text>
          Are you sure you want to request a refund for
          <strong>{{ selectedTransaction?.id }}</strong>?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="refundDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="submitRefund">
            Confirm Refund
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" timeout="2500">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>