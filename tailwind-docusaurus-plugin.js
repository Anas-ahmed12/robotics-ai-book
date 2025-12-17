const path = require('path');

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  // ... existing configuration
  plugins: [
    // Add a plugin to handle PostCSS processing
    async function myPlugin(context, options) {
      return {
        name: 'tailwindcss-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(require('tailwindcss'));
          postcssOptions.plugins.push(require('autoprefixer'));
          return postcssOptions;
        },
      };
    },
  ],
};