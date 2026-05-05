<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-3 mb-6">
    <div>
      <h1 class="text-h4 font-weight-bold mb-1">
        {{ title }}
      </h1>

      <p
        v-if="subtitle"
        class="text-body-2 text-medium-emphasis"
      >
        {{ subtitle }}
      </p>
    </div>

    <slot />
  </div>
</template>