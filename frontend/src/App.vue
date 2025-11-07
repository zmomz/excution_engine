<script setup>
import { RouterView } from 'vue-router'
import Toolbar from 'primevue/toolbar';
</script>

<template>
  <div id="app">
    <Toolbar>
      <template #start>
        <h1 class="text-2xl font-bold text-primary-600">Execution Engine</h1>
      </template>
    </Toolbar>

    <main class="p-4">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* We can add global styles here if needed, but we'll rely on Tailwind for now */
</style>