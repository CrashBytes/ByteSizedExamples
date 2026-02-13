/**
 * Rollup Configuration for Chrome Extension
 * 
 * Bundles ES modules into Chrome-compatible JavaScript files
 * Creates separate bundles for service worker, popup, and options page
 */

import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// Production mode (minify)
const production = !process.env.ROLLUP_WATCH;

// Common plugins for all bundles
const plugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  production && terser({
    compress: {
      drop_console: false, // Keep console logs for debugging
      drop_debugger: true
    },
    format: {
      comments: false
    }
  })
];

export default [
  // Background Service Worker Bundle
  {
    input: 'background/service-worker.js',
    output: {
      file: 'dist/service-worker.js',
      format: 'iife',
      sourcemap: !production
    },
    plugins
  },

  // Popup Bundle
  {
    input: 'popup/popup.js',
    output: {
      file: 'dist/popup.js',
      format: 'iife',
      sourcemap: !production
    },
    plugins
  },

  // Options Page Bundle
  {
    input: 'options/options.js',
    output: {
      file: 'dist/options.js',
      format: 'iife',
      sourcemap: !production
    },
    plugins,
    external: ['chart.js'] // Chart.js loaded via CDN in options.html
  }
];
