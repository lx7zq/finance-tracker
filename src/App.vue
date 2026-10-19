<script setup lang="ts">
import { RouterView } from 'vue-router'

import Navbar from '@/components/layout/Navbar.vue'
</script>

<template>
  <v-app>
    <Navbar />
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
