import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        // Angular libraries are run through Vite: left to Node they would load a second copy of @angular/core.
        inline: [/@angular\//, /ngx-tiptap/],
      },
    },
  },
});
