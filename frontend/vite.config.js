import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import federation from '@originjs/vite-plugin-federation';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),
    /*federation({
      name: 'opentask-erp',
      remotes: {
        // L'URL sera celle de ton déploiement Render pour le projet React
        openstorm: 'https://openstorm-ifs6.onrender.com/assets/remoteEntry.js',
      },
      shared: ['vue']
    }),*/
  ],
})
