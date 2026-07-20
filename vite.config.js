import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets work on both <user>.github.io/<repo>/ and a custom domain.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
