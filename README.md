# EOSC Scholarly Commons UI

Angular 22 front end for the EOSC Node Scholarly Commons service catalogue (npm package `resource-catalogue-ui`).

## Requirements

Node 22.22.3 or newer (see `.nvmrc`, which tracks the latest 22); Angular 22 needs Node 22.22.3, 24.15 or newer, and TypeScript 6.

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

1. **Lint:** `npm run lint:ci`. Many Angular rules (standalone, `inject()`, signals, OnPush, control flow, `NgOptimizedImage`, no `any`, no `console.log`) are warnings; `console.warn` and `console.error` are allowed, and `== null` checks are too. The limit in the `lint:ci` script is the current count; it can only go down. Fix warnings, then lower the number. The shell and the redesign (`pages/scholarly-commons`, `shared/scholarly-commons`, the error pages, `app.*`, `main.ts` and the auth and resource services, listed in `eslint.config.mjs`) are held to `error`, so new code there cannot add warnings, and `== null` is not allowed there. `src/catalogue-ui` is excluded from these rules.
2. **Build:** `npm run build:prod`. The budgets in `angular.json` (initial bundle 1.8 MB warning, 2.1 MB error) fail the build when the bundle grows.
3. **Audit:** `npm audit --audit-level=critical` prints every finding and fails on critical ones only.

TypeScript runs with `alwaysStrict`, `noImplicitThis`, `useUnknownInCatchVariables`, `strictFunctionTypes`, `strictBindCallApply`, `noFallthroughCasesInSwitch`, `noImplicitOverride` and `noImplicitReturns`. `noImplicitAny` and `strictNullChecks` are not on yet, and `strict` itself is set to `false` because TypeScript 6 would otherwise switch every strict flag on at once. Angular's `strictTemplates` is on, so the build fails on template type errors (for example a wrongly typed input binding or a misspelled member); its null checks only take effect once `strictNullChecks` is on.

## Docker

`docker build -t catalogue-ui .` builds the production bundle and an nginx image. At start `init.sh` writes the nginx config from three environment variables: `SERVER_NAME`, `PROXY_API_ENDPOINT` (the catalogue API, served under `/api`) and `PROXY_PAGES_ENDPOINT` (the Joomla site embedded in iframes). See `docker-compose.yml`.

## Joomla pages (iframes)

Home, How to start, Use Cases, News, Training, Terms & Policies and Join are Joomla articles shown in an iframe through the `/pages` proxy. The list is `IFRAME_PAGES` in `src/app/pages/scholarly-commons/iframe-page/iframe-pages.config.ts`; a new page is one entry with its article id.

**Writing links in Joomla content.** Use host-free, root-relative links, so that nothing in them depends on where Joomla is hosted:

| Link goes to | Write | What happens |
| --- | --- | --- |
| A page of this app | The app's own path: `/discover`, `/join`, `/how-to-start#esc-researcher` | The app navigates there. Hovering shows the app's address. |
| Another Joomla page or a file | The Joomla path: `/some-article.html`, `/images/guide.pdf` | Opens in a new tab on the Joomla site |
| Another website | The full `https://` address | Opens in a new tab |
| A place on the same page | `#anchor` | Handled by the browser |

Avoid the Joomla host, `.html` aliases and `?option=com_content&view=article&id=` for pages of the app. The older forms still work and are rewritten to the app's path when the page loads, so existing content keeps working until it is edited.

**Moving the Joomla host.** Change `PROXY_PAGES_ENDPOINT` (deployment), the proxy target in `proxy.conf.json` (dev server) and `JOOMLA_SITE_ORIGIN` in the three `src/environments` files. Links in the content need no change.

## Privacy and consent

Nothing optional runs before the visitor agrees. `ConsentService` (`src/app/shared/scholarly-commons/consent`) keeps their choices in `localStorage` (`sc-consent`) for six months; the banner asks on the first visit and again from "Cookie settings" in the footer. `TrackingService` (`src/app/services`) starts the optional services when the matching choice is true:

| Choice | Service | Started by |
| --- | --- | --- |
| Statistics | Matomo (`MATOMO_URL`, `MATOMO_SITE` in `src/environments`). A site id of 0 or less (development, beta) never loads it. | `MatomoInitializerService`; `NgxMatomoModule` runs in `deferred` mode, so the script is not requested before consent |
| Error reports | Sentry (`sentry` and `disableSentry` in `src/environments`) | `startSentry()` in `src/app/services/sentry-init.ts` |

Withdrawing Sentry stops it at once. Withdrawing statistics deletes Matomo's cookies and reloads the page, because the Matomo script cannot be unloaded. Fonts and icons are self-hosted (the `@fontsource` packages and `material-icons`, listed under `styles` in `angular.json`), so no page request goes to Google.

To add another optional service, give it a flag in `ConsentService`, a switch in the banner, and start it from `TrackingService`; raise `CONSENT_VERSION` so that everyone is asked again.

## Layout

- `src/app`: the application. `pages/scholarly-commons` and `shared/scholarly-commons` hold the current design (search, service detail, header, footer, Joomla iframe pages).
- `src/catalogue-ui`: the dynamic form library used by the service and datasource edit forms. It is lazy-loaded.
- `src/assets/eosc-scholarly-node-theme`: the UIkit LESS theme, built by Angular from `styles.less`.
