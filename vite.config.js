import { defineConfig } from 'vite';
import { resolve } from 'path';
import { glob } from 'glob';

// Get all HTML files in the root directory, except for the test files
const testFiles = glob.sync('test/*.html');
const allFiles = glob.sync('*.html');
const inputFiles = allFiles.filter(file => !testFiles.includes(file));

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Automatically add all other non-test HTML files
        ...inputFiles.reduce((acc, file) => {
          const name = file.replace('.html', '');
          if (name !== 'index') {
            acc[name] = resolve(__dirname, file);
          }
          return acc;
        }, {})
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 