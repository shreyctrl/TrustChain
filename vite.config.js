import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE 'trustchain' WITH YOUR REPO NAME
  // Example: If your repo is github.com/john/my-app, put '/my-app/'
  base: '/TrustChain/', 
})