import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        // rxjs 6 has no ESM "exports" map, so Node cannot resolve the `rxjs/operators` import inside @angular/core.
        // Running both through Vite lets it find the folder's package.json; drop this when rxjs moves to 7.
        inline: [/@angular\//, /rxjs/],
      },
    },
  },
});
