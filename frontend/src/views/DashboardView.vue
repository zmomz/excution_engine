<template>
  <div class="dashboard-container">
    <h1>Welcome to your Dashboard</h1>
    <p>This is a protected route.</p>

    <div class="api-keys-section">
      <h2>API Key Management</h2>
      <form @submit.prevent="createApiKey" class="api-key-form">
        <div class="form-group">
          <label for="apiKeyName">Key Name</label>
          <input type="text" id="apiKeyName" v-model="newApiKey.name" required placeholder="e.g., My Exchange">
        </div>
        <div class="form-group">
          <label for="apiKeyValue">API Key</label>
          <input type="password" id="apiKeyValue" v-model="newApiKey.key" required placeholder="Enter your API key">
        </div>
        <button type="submit">Add API Key</button>
      </form>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="api-keys-list">
        <h3>Your API Keys</h3>
        <ul>
          <li v-for="key in apiKeys" :key="key.id">
            <span>{{ key.name }}</span>
            <!-- In a real app, you'd have buttons to delete or view the key -->
          </li>
        </ul>
        <p v-if="apiKeys.length === 0">You don't have any API keys yet.</p>
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
.dashboard-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.api-keys-section {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.api-key-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.error {
  color: red;
  margin-bottom: 15px;
}

.api-keys-list ul {
  list-style-type: none;
  padding: 0;
}

.api-keys-list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
}
</style>