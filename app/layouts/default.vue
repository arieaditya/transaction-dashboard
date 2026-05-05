<template>
  <v-app>
    <v-app-bar flat border>
      <v-container class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" size="36" rounded="lg">
            <span class="text-subtitle-2 font-weight-bold">DP</span>
          </v-avatar>

          <div>
            <div class="text-subtitle-1 font-weight-bold">
              Transaction Dashboard
            </div>
            <div class="text-caption text-medium-emphasis">
              Powered by Nuxt 4 & Vuetify 4
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-2">
          <v-btn variant="text" to="/dashboard/transactions">
            Transactions
          </v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-5">
      <slot />
    </v-main>
  </v-app>
</template>