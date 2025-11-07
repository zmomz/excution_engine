<script setup>
import { RouterView } from 'vue-router'
import Toolbar from 'primevue/toolbar';
</script>

<template>
  <div id="app">
    <Toolbar class="shadow-md">
      <template #start>
        <div class="flex align-items-center">
          <i class="pi pi-bolt text-2xl text-primary mr-2"></i>
          <h1 class="text-2xl font-semibold">Execution Engine</h1>
        </div>
      </template>
    </Toolbar>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}
</style>

<style>
/* We can add global styles here if needed, but we'll rely on Tailwind for now */
</style>