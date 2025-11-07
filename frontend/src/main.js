import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import Soho from '@primevue/themes/soho-light';
import './assets/styles.css';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Soho
    }
});

app.mount('#app')
