import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build = jedan samostalni dist/index.html (fontovi, slike, three.js unutra).
// Otvara se dvoklikom, radi bez interneta (osim zadnjeg slajda koji vodi na aplikaciju).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: Infinity, chunkSizeWarningLimit: 4000 },
})
