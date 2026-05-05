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

const statusOptions = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'] as const

const filteredTransactions = computed(() => {
  return transactions.filter((item) => {
    const keyword = search.value.toLowerCase()

    const matchesSearch =
      item.id.toLowerCase().includes(keyword) ||
      item.customerName.toLowerCase().includes(keyword)

    const matchesStatus =
      selectedStatus.value === 'ALL' || item.status === selectedStatus.value

    return matchesSearch && matchesStatus
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

    <v-card class="pa-4 mb-4" rounded="lg">
      <v-row>
        <v-col cols="12" md="8">
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
        title="No transactions found"
        subtitle="Try changing the search keyword or selected status filter to see more results."
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