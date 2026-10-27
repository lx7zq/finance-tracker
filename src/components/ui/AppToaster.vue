<!-- src/components/ui/AppToaster.vue -->
<template>
  <v-snackbar v-model="toast.visible" :color="toast.color" timeout="2500" location="bottom">
    {{ toast.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>
