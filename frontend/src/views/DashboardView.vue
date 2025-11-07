<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

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

<template>
  <div class="container mx-auto px-6 py-8">
    <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>
    <p class="mt-2 text-gray-600">Welcome back, manage your settings below.</p>

    <div class="mt-8 p-8 bg-white rounded-lg shadow-lg">
      <h3 class="text-xl font-semibold text-gray-800 flex items-center">
        <i class="pi pi-key mr-2"></i>
        API Key Management
      </h3>
      
      <form @submit.prevent="createApiKey" class="mt-6 space-y-4">
        <div class="flex flex-col md:flex-row md:space-x-6">
          <div class="flex-1 p-field">
            <label for="apiKeyName" class="text-sm font-medium text-gray-700">Key Name</label>
            <InputText id="apiKeyName" v-model="newApiKey.name" type="text" class="w-full mt-1" placeholder="e.g., My Exchange" />
          </div>
          <div class="flex-1 p-field">
            <label for="apiKeyValue" class="text-sm font-medium text-gray-700">API Key</label>
            <InputText id="apiKeyValue" v-model="newApiKey.key" type="password" class="w-full mt-1" placeholder="Enter your API key" />
          </div>
        </div>
        <div>
          <Button type="submit" label="Add API Key" icon="pi pi-plus" />
        </div>
      </form>

      <div v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>

      <div class="mt-8">
        <h4 class="text-lg font-semibold text-gray-800">Your API Keys</h4>
        <DataTable :value="apiKeys" :paginator="true" :rows="5" class="p-datatable-sm mt-4">
          <Column field="name" header="Name"></Column>
          <Column header="Actions">
            <template #body>
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>