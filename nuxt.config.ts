// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],

  googleFonts: {
    families: {
      'Playfair Display': [400, 600, 700, 900],
      'Noto Sans SC': [300, 400, 500, 700],
    },
    display: 'swap',
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        },
      ],
    },
  },

  runtimeConfig: {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || 3306,
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '123456',
    dbName: process.env.DB_NAME || 'luxe_nail',
    jwtSecret: process.env.JWT_SECRET || 'luxe-nail-admin-secret-key-2024',
  },
})
