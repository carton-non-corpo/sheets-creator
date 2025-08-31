// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private keys (only available on server-side)
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    // Public keys (exposed to client-side)
    public: {}
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@pinia/nuxt',
    'shadcn-nuxt'
  ],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      sourcemap: process.env.NODE_ENV === 'development', // Only generate sourcemaps in development
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
    prerender: {
      autoSubfolderIndex: false
    }
  }
})