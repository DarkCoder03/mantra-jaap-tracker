import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mantra-jaap-tracker/', // <-- Dhyan rahe, aage aur peeche dono taraf slash (/) hona zaroori hai!
})