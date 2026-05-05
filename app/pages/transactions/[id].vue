<script setup lang="ts">
import { transactions } from '~/data/transactions'

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

const detailItems = computed(() => {
  if (!transaction.value) return []

  return [
    {
      label: 'Customer Name',
      value: transaction.value.customerName
    },
    {
      label: 'Email',
      value: transaction.value.email
    },
    {
      label: 'Payment Method',
      value: transaction.value.paymentMethod
    },
    {
      label: 'Created At',
      value: transaction.value.createdAt
    },
    {
      label: 'Refundable',
      value: transaction.value.refundable ? 'Yes' : 'No'
    }
  ]
})
</script>

<template>
  <v-container class="py-8">
    <div class="mb-6">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        to="/dashboard/transactions"
      >
        Back to transactions
      </v-btn>
    </div>

    <template v-if="transaction">
      <PageHeader
        :title="transaction.id"
        subtitle="Review transaction information and payment status."
      >
        <template #default>
          <StatusChip :status="transaction.status" />
        </template>
      </PageHeader>

      <v-row>
        <v-col cols="12" md="8">
          <v-card rounded="lg" class="pa-6 mb-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline text-medium-emphasis">
                  Transaction Amount
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ formatCurrency(transaction.amount) }}
                </div>
              </div>

              <v-btn
                color="error"
                variant="tonal"
                :disabled="!transaction.refundable"
              >
                Request Refund
              </v-btn>
            </div>

            <v-divider class="mb-4" />

            <v-list lines="two" class="pa-0">
              <v-list-item
                v-for="item in detailItems"
                :key="item.label"
                :title="item.label"
                :subtitle="item.value"
                class="px-0"
              />
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card rounded="lg" class="pa-6 mb-4">
            <div class="text-overline text-medium-emphasis mb-2">
              Status Summary
            </div>

            <div class="d-flex align-center ga-2 mb-4">
              <StatusChip :status="transaction.status" />
            </div>

            <v-alert
              type="info"
              variant="tonal"
              density="comfortable"
            >
              This page is prepared as a public-friendly transaction detail view
              for SSR use later in the sprint.
            </v-alert>
          </v-card>

          <v-card rounded="lg" class="pa-6">
            <div class="text-overline text-medium-emphasis mb-2">
              Next Steps
            </div>

            <div class="d-flex flex-column ga-2">
              <v-btn variant="outlined" block>
                Download Receipt
              </v-btn>
              <v-btn variant="outlined" block>
                Contact Support
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-card v-else rounded="lg" class="pa-6">
      <v-alert
        type="error"
        variant="tonal"
        title="Transaction not found"
        text="The requested transaction ID does not exist in the current dataset."
      />
    </v-card>
  </v-container>
</template>