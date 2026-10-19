<template>
  <v-app-bar elevation="2" color="surface" density="comfortable" class="px-4">
    <!-- Logo -->
    <template #prepend>
      <v-avatar color="primary" size="40" class="mr-3"> 💰 </v-avatar>
    </template>

    <v-app-bar-title class="font-weight-bold text-primary"> Finance Tracker </v-app-bar-title>

    <v-spacer />

    <!-- Menu -->
    <v-btn to="/" prepend-icon="mdi-view-dashboard" variant="text" rounded="xl" class="mx-1">
      Dashboard
    </v-btn>

    <v-btn
      to="/transactions"
      prepend-icon="mdi-swap-horizontal"
      variant="text"
      rounded="xl"
      class="mx-1"
    >
      รายการ
    </v-btn>

    <v-btn to="/budget" prepend-icon="mdi-wallet" variant="text" rounded="xl" class="mx-1">
      งบประมาณ
    </v-btn>

    <v-divider vertical class="mx-3" />

    <!-- User -->
    <v-btn icon variant="text">
      <v-icon>mdi-bell-outline</v-icon>
    </v-btn>

    <v-avatar color="primary" size="36" class="ml-2">
      <v-icon>mdi-account</v-icon>
    </v-avatar>
  </v-app-bar>
</template>
