<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

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

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <h2 class="text-3xl font-bold text-center text-gray-800">Welcome Back</h2>
      <form @submit.prevent="login" class="space-y-6">
        <div class="p-field">
          <label for="username" class="text-sm font-medium text-gray-700">Username</label>
          <InputText id="username" v-model="username" type="text" class="w-full mt-1" />
        </div>
        <div class="p-field">
          <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          <InputText id="password" v-model="password" type="password" class="w-full mt-1" />
        </div>
        <div>
          <Button type="submit" label="Login" class="w-full" />
        </div>
      </form>
      <p v-if="error" class="text-sm text-center text-red-600">{{ error }}</p>
    </div>
  </div>
</template>


