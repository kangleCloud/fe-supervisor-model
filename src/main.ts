import { createApp } from 'vue';

import App from '@/App.vue';
import { bootstrapApp } from '@/app/bootstrap';

const app = createApp(App);

void bootstrapApp(app);
