# EOSC Scholarly Commons UI

Angular 21 front end for the EOSC Node Scholarly Commons service catalogue (npm package `resource-catalogue-ui`).

## Requirements

Node 22 (see `.nvmrc`); Angular 21 needs Node 20.19 or newer.

## Commands

| Command | What it does |
| --- | --- |
| `npm ci` | Install the locked dependencies |
| `npm start` | Dev server on http://localhost:3000 with `proxy.conf.json`: `/openaire` goes to `localhost:8482` (the catalogue API, for example through an SSH tunnel) and the Joomla pages to https://innovation.openaire.eu |
| `npm run build:prod` | Production build (AOT, hashed bundles) into `dist/resource-catalogue-ui`; `build:beta` uses the beta environment |
| `npm run lint` | ESLint over TypeScript and templates |
| `npm run lint:ci` | Same, but fails when the warning count is above the limit in `package.json` |

## Quality gates

The GitHub workflow in `.github/workflows/ci.yml` runs on every pull request and on pushes to `master`:

1. **Lint:** `npm run lint:ci`. Many Angular rules (standalone, `inject()`, signals, OnPush, control flow, `NgOptimizedImage`, no `any`, no console) are warnings. The limit in the `lint:ci` script is the current count; it can only go down. Fix warnings, then lower the number. `src/catalogue-ui` is excluded from these rules.
2. **Build:** `npm run build:prod`. The budgets in `angular.json` (initial bundle 1.8 MB warning, 2.1 MB error) fail the build when the bundle grows.
3. **Audit:** `npm audit --audit-level=critical` prints every finding and fails on critical ones only.

TypeScript runs with `alwaysStrict`, `noImplicitThis`, `useUnknownInCatchVariables`, `strictFunctionTypes`, `strictBindCallApply`, `noFallthroughCasesInSwitch`, `noImplicitOverride` and `noImplicitReturns`. `noImplicitAny` and `strictNullChecks` are not on yet.

## Docker

`docker build -t catalogue-ui .` builds the production bundle and an nginx image. At start `init.sh` writes the nginx config from three environment variables: `SERVER_NAME`, `PROXY_API_ENDPOINT` (the catalogue API, served under `/api`) and `PROXY_PAGES_ENDPOINT` (the Joomla site embedded in iframes). See `docker-compose.yml`.

## Layout

- `src/app`: the application. `pages/scholarly-commons` and `shared/scholarly-commons` hold the current design (search, service detail, header, footer, Joomla iframe pages).
- `src/catalogue-ui`: the dynamic form library used by the service and datasource edit forms. It is lazy-loaded.
- `src/assets/eosc-scholarly-node-theme`: the UIkit LESS theme, built by Angular from `styles.less`.
