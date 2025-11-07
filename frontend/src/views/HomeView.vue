<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';

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
  <div class="flex justify-content-center align-items-center min-h-screen">
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-center">Login</h2>
      </template>
      <template #content>
        <form @submit.prevent="login" class="p-fluid">
          <div class="field">
            <label for="username">Username</label>
            <InputText id="username" v-model="username" type="text" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <InputText id="password" v-model="password" type="password" />
          </div>
          <Button type="submit" label="Login" class="mt-4" />
        </form>
        <p v-if="error" class="text-center text-red-500 mt-4">{{ error }}</p>
      </template>
    </Card>
  </div>
</template>


