<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="d-flex flex-column align-center text-center py-12 px-4">
    <v-icon size="48" color="medium-emphasis" class="mb-4">
      mdi-database-search-outline
    </v-icon>

    <h3 class="text-h6 font-weight-bold mb-2">
      {{ title }}
    </h3>

    <p class="text-body-2 text-medium-emphasis" style="max-width: 420px;">
      {{ subtitle }}
    </p>
  </div>
</template>