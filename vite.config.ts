import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-core',
              test: /node_modules[\\/]three[\\/]/,
              priority: 20,
              minSize: 0,
              maxSize: 430 * 1024,
            },
            {
              name: 'three-renderer',
              test: /node_modules[\\/](?:@react-three|postprocessing|react-composer|maath|camera-controls|meshline|troika-three-text)[\\/]/,
              priority: 10,
              minSize: 0,
            },
          ],
        },
      },
    },
  },
})
