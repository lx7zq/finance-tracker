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
          background: '#FBF6F2',
          surface: '#FFFFFF',
          'surface-variant': '#F8E9E9',
          primary: '#D9738A',
          secondary: '#8FBCE6',
          error: '#E06A5E',
          info: '#7FA8D9',
          success: '#5BAE8C',
          warning: '#E5B84B',
          ink: '#43303A',
          brass: '#E5B84B',
          line: '#F0DFDD',
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
