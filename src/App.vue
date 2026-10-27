<script setup lang="ts">
import { RouterView } from 'vue-router'

import Navbar from '@/components/layout/Navbar.vue'
import AppToaster from '@/components/ui/AppToaster.vue'
</script>

<template>
  <v-app>
    <Navbar />
    <v-main>
      <RouterView />
    </v-main>
    <AppToaster />
  </v-app>
</template>
