<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-center text-gray-700">Login</h2>
      <form @submit.prevent="login" class="space-y-6">
        <div>
          <label for="username" class="text-sm font-medium text-gray-700">Username</label>
          <input type="text" id="username" v-model="username" required
                 class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="password" v-model="password" required
                 class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <button type="submit"
                  class="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Login
          </button>
        </div>
      </form>
      <p v-if="error" class="text-sm text-center text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const login = async () => {
  try {
    const response = await axios.post('http://localhost:8001/token', {
      username: username.value,
      password: password.value
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: [(data) => {
        const formData = new URLSearchParams();
        for (const key in data) {
          formData.append(key, data[key]);
        }
        return formData;
      }]
    });
    localStorage.setItem('access_token', response.data.access_token);
    console.log("Login successful! Token:", response.data.access_token);
    router.push('/dashboard');
  } catch (err) {
    error.value = 'Invalid username or password';
    console.error("Login error:", err);
  }
};
</script>

<style scoped>
/* Scoped styles are no longer needed as we are using Tailwind CSS */
</style>
