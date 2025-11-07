<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app" class="bg-gray-100 min-h-screen">
    <header class="bg-white shadow">
      <nav class="container mx-auto px-6 py-3">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-semibold text-gray-700">Execution Engine</h1>
          <!-- Navigation links can be added here later -->
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
/* We can add global styles here if needed, but we'll rely on Tailwind for now */
</style>