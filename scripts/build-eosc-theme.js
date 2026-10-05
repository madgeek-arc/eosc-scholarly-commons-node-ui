// Precompiles src/assets/eosc-scholarly-node-theme/less/_import.less (which imports UIkit's raw
// LESS source, written for Less 2/3's always-divide math) into a static CSS file.
//
// Why this exists: Angular's "@angular-devkit/build-angular:browser" builder hardcodes its own
// less-loader options (no way to pass a `math` option via angular.json — its schema only allows
// `stylePreprocessorOptions.includePaths`), and it resolves `less` from its OWN nested
// node_modules copy (currently 4.9.0) regardless of what's installed at the top level. Less 4
// changed the default so a bare `/` in a value is no longer computed as division, which breaks
// UIkit 3.3.7's LESS source (e.g. `round(@table-cell-padding-vertical / 3)` in its table
// component). Since we can't configure that builder's math mode, and forcing a global `less`
// downgrade via package.json "overrides" doesn't reliably propagate through the nested
// dependency chain (@angular-devkit/build-angular -> @angular/build -> less, which has its own
// peer requirement on less ^4.x), we compile this one theme ourselves — using the top-level
// `less` devDependency directly, with `math: 'always'` explicitly set — into a plain CSS file
// that `src/styles.less` then just imports like any other precompiled stylesheet (theme.css,
// openaire-custom.css, ...).
//
// Run via `npm run build-eosc-theme`, or automatically before `ng build`/`ng serve` through the
// "prebuild"/"prestart" npm script hooks.
const fs = require('fs');
const path = require('path');
const less = require('less');

const projectRoot = path.resolve(__dirname, '..');
const entry = path.join(projectRoot, 'src/assets/eosc-scholarly-node-theme/less/_import.less');
// Written into the SAME directory as the entry file (not one level up) because `rewriteUrls`
// below rewrites every relative url() found in UIkit's deeply-nested component .less files (its
// form/nav background SVGs) to be relative to the entry file's own directory — the compiled CSS
// has to live there too for those rewritten paths to actually resolve.
const outFile = path.join(projectRoot, 'src/assets/eosc-scholarly-node-theme/less/eosc-scholarly-node-theme.css');

const source = fs.readFileSync(entry, 'utf8');

less.render(source, {
  filename: entry,
  paths: [path.join(projectRoot, 'node_modules'), path.dirname(entry)],
  math: 'always',
  rewriteUrls: 'all',
})
  .then((output) => {
    fs.writeFileSync(outFile, output.css);
    console.log(`Compiled EOSC scholarly-commons theme -> ${path.relative(projectRoot, outFile)}`);
  })
  .catch((err) => {
    console.error('Failed to compile the EOSC scholarly-commons theme LESS:');
    console.error(err.message);
    process.exit(1);
  });
