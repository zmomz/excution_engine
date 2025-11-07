<template>
  <div class="container mx-auto px-6 py-8">
    <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>
    <p class="mt-2 text-gray-600">Welcome back, manage your settings below.</p>

    <div class="mt-8 p-8 bg-white rounded-lg shadow-lg">
      <h3 class="text-xl font-semibold text-gray-800 flex items-center">
        <svg class="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        API Key Management
      </h3>
      
      <form @submit.prevent="createApiKey" class="mt-6 space-y-4">
        <div class="flex flex-col md:flex-row md:space-x-6">
          <div class="flex-1">
            <label for="apiKeyName" class="text-sm font-medium text-gray-700">Key Name</label>
            <input type="text" id="apiKeyName" v-model="newApiKey.name" required placeholder="e.g., My Exchange"
                   class="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
          </div>
          <div class="flex-1">
            <label for="apiKeyValue" class="text-sm font-medium text-gray-700">API Key</label>
            <input type="password" id="apiKeyValue" v-model="newApiKey.key" required placeholder="Enter your API key"
                   class="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
          </div>
        </div>
        <div>
          <button type="submit"
                  class="px-5 py-2 font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all">
            Add API Key
          </button>
        </div>
      </form>

      <div v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>

      <div class="mt-8">
        <h4 class="text-lg font-semibold text-gray-800">Your API Keys</h4>
        <ul class="mt-4 border-t border-gray-200">
          <li v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between py-4 border-b border-gray-200">
            <span class="text-gray-700 font-medium">{{ key.name }}</span>
            <!-- In a real app, you'd have buttons to delete or view the key -->
          </li>
        </ul>
        <p v-if="apiKeys.length === 0" class="mt-4 text-gray-500">You don't have any API keys yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const newApiKey = ref({
  name: '',
  key: '',
});
const apiKeys = ref([]);
const error = ref('');

const getApiKeys = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get('http://localhost:8001/api-keys/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    apiKeys.value = response.data;
  } catch (err) {
    error.value = 'Failed to fetch API keys.';
    console.error(err);
  }
};

const createApiKey = async () => {
  try {
    const token = localStorage.getItem('access_token');
    await axios.post('http://localhost:8001/api-keys/', newApiKey.value, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    newApiKey.value.name = '';
    newApiKey.value.key = '';
    error.value = '';
    await getApiKeys(); // Refresh the list
  } catch (err) {
    error.value = 'Failed to create API key.';
    console.error(err);
  }
};

onMounted(() => {
  getApiKeys();
});
</script>

<style scoped>
/* Scoped styles are no longer needed as we are using Tailwind CSS */
</style>
