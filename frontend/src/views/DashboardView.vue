<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';

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
  <div>
    <h2 class="text-3xl font-semibold">Dashboard</h2>
    <p class="mt-2 text-color-secondary">Welcome back, manage your settings below.</p>

    <div class="grid mt-6">
      <div class="col-12">
        <Card>
          <template #title>
            <h3 class="flex align-items-center text-xl font-semibold">
              <i class="pi pi-key mr-2"></i>
              API Key Management
            </h3>
          </template>
          <template #content>
            <form @submit.prevent="createApiKey" class="p-fluid mt-4">
              <div class="formgrid grid">
                <div class="field col-12 md:col-5">
                  <label for="apiKeyName">Key Name</label>
                  <InputText id="apiKeyName" v-model="newApiKey.name" type="text" placeholder="e.g., My Exchange" />
                </div>
                <div class="field col-12 md:col-5">
                  <label for="apiKeyValue">API Key</label>
                  <InputText id="apiKeyValue" v-model="newApiKey.key" type="password" placeholder="Enter your API key" />
                </div>
                <div class="field col-12 md:col-2">
                  <Button type="submit" label="Add Key" icon="pi pi-plus" class="w-full" />
                </div>
              </div>
            </form>

            <div v-if="error" class="col-12">
              <p class="text-red-500">{{ error }}</p>
            </div>

            <div class="mt-6">
              <DataTable :value="apiKeys" :paginator="true" :rows="5" class="p-datatable-sm">
                <template #header>
                    <h4 class="text-lg font-semibold">Your API Keys</h4>
                </template>
                <Column field="name" header="Name"></Column>
                <Column header="Actions" style="width: 8rem">
                  <template #body>
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>