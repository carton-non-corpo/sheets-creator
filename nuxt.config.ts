// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private keys (only available on server-side)
    googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT,
    googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,

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
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      autoSubfolderIndex: false
    }
  }
})