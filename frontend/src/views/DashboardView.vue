<template>
  <div class="container mx-auto px-6 py-8">
    <h2 class="text-2xl font-bold text-gray-700">Dashboard</h2>
    <p class="mt-2 text-gray-600">Welcome to your protected dashboard.</p>

    <div class="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h3 class="text-lg font-medium text-gray-700">API Key Management</h3>
      
      <form @submit.prevent="createApiKey" class="mt-4 space-y-4">
        <div class="flex flex-col md:flex-row md:space-x-4">
          <div class="flex-1">
            <label for="apiKeyName" class="text-sm font-medium text-gray-700">Key Name</label>
            <input type="text" id="apiKeyName" v-model="newApiKey.name" required placeholder="e.g., My Exchange"
                   class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="flex-1">
            <label for="apiKeyValue" class="text-sm font-medium text-gray-700">API Key</label>
            <input type="password" id="apiKeyValue" v-model="newApiKey.key" required placeholder="Enter your API key"
                   class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          </div>
        </div>
        <div>
          <button type="submit"
                  class="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add API Key
          </button>
        </div>
      </form>

      <div v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>

      <div class="mt-6">
        <h4 class="text-md font-medium text-gray-700">Your API Keys</h4>
        <ul class="mt-2 border-t border-gray-200">
          <li v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between py-3 border-b border-gray-200">
            <span class="text-gray-700">{{ key.name }}</span>
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
