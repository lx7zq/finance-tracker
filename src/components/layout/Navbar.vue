<template>
  <v-app-bar flat color="ink" class="px-4 px-sm-6" density="comfortable">
    <template #prepend>
      <span class="brand-mark" aria-hidden="true">฿</span>
      <span class="brand-name font-display">บัญชีเงิน</span>
    </template>

    <v-spacer />

    <v-btn to="/" variant="text" rounded="lg" class="nav-btn mx-1"> ภาพรวม </v-btn>
    <v-btn to="/transactions" variant="text" rounded="lg" class="nav-btn mx-1"> รายการ </v-btn>
    <v-btn to="/budget" variant="text" rounded="lg" class="nav-btn mx-1"> งบประมาณ </v-btn>
  </v-app-bar>
</template>
