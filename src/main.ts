import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './styles/main.css'

import { createApp } from 'vue'

import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'ledger',
    themes: {
      ledger: {
        colors: {
          background: '#F4F5F1',
          surface: '#FFFFFF',
          'surface-variant': '#E8EDE6',
          primary: '#1E5C42',
          secondary: '#C9A227',
          error: '#B3453D',
          info: '#4A6D8C',
          success: '#2F7D5C',
          warning: '#C9A227',
          ink: '#16241C',
          brass: '#C9A227',
          line: '#E3E6E0',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
