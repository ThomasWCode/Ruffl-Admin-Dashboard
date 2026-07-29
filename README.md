# Ruffl admin dashboard

Ruffl Admin is a separate website for authorised support staff. It talks to `Ruffl-Backend` and provides moderation, dispute, and marketplace oversight tools.

This project uses:

- **React** to build the user interface from reusable components.
- **TypeScript** to check JavaScript types before the app is built.
- **Vite** to run the local development website and create production files.
- **Vitest** to run automated tests.
- **GitHub Actions** to run repeatable build and deployment jobs on GitHub.
- **GitHub Pages** to host the finished static website.
- **npm** to install libraries and run the commands in `package.json`.

You do not need prior React, Vite, or GitHub Actions experience to run or deploy the dashboard. Follow the sections in order.

## What is implemented

- Admin-only login using the shared backend account system
- Marketplace totals and recent activity
- User search, status filtering, warnings, suspension/unsuspension, soft deletion, and guarded anonymization
- Read-only commission and value overview
- Dispute financial context, assignment, adjudication, and closure
- Admin support inbox with start-chat, conversation detail, three-second polling, and replies
- Sentry browser error reporting and a readable fatal-error fallback
- Automatic short-lived CSRF token handling for every state-changing action
- Responsive desktop/mobile layout

## Project structure

```text
Ruffl-Admin-Dashboard/
|-- .github/workflows/
|   |-- ci.yml             Checks every push and pull request
|   `-- deploy-pages.yml   Builds and publishes GitHub Pages
|-- src/                   React application code
|-- test/                  Automated tests
|-- .env.example           Safe local configuration template
|-- index.html             Vite page entry
|-- package.json           Dependencies and runnable commands
`-- vite.config.ts         Vite and URL-base configuration
```

## 1. Install the required software

- Install **Node.js 22 LTS** from [nodejs.org](https://nodejs.org/). The minimum supported version is Node.js 20.19.
- npm is installed with Node.js; it does not need a separate installer.
- Install Git if you plan to push the repository to GitHub.
- A code editor such as Visual Studio Code is recommended.

Open PowerShell and verify the installations:

```powershell
node --version
npm --version
git --version
```

If a command is not recognised, close and reopen PowerShell after installing the program.

## 2. First-time local setup

Open PowerShell and run:

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Admin-Dashboard
npm install
Copy-Item .env.example .env
```

- `npm install` downloads the libraries listed in `package.json`.
- `Copy-Item` creates your local configuration from the safe example.
- Run `npm install` again after pulling a change to `package.json` or `package-lock.json`.

The local `.env` should contain:

```dotenv
VITE_API_URL=http://localhost:3000
VITE_BASE_PATH=/
VITE_SENTRY_DSN=
VITE_SENTRY_RELEASE=ruffl-admin@local
```

| Setting | Purpose |
|---|---|
| `VITE_API_URL` | Address of the Ruffl backend. `localhost:3000` is correct when both processes run on this computer. |
| `VITE_BASE_PATH` | URL path from which the website is served. Use `/` locally. |
| `VITE_SENTRY_DSN` | Optional local Sentry browser DSN. Production should use the admin-dashboard project DSN. |
| `VITE_SENTRY_RELEASE` | Release label used to connect an error to the deployed code. |

Vite exposes variables beginning with `VITE_` to the browser. They must not contain passwords, private keys, database connection strings, or other secrets.

## 3. Run the dashboard locally

Start the backend in one PowerShell window:

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Backend
npm install
npm run dev
```

Start the dashboard in a second PowerShell window:

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Admin-Dashboard
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Use the development admin account:

- Email: `admin@demo.ruffl`
- Password: `RufflDemo1!`

The backend must have `SEED_DEMO_DATA=true`. Never enable demo accounts in production.

Keep both terminal windows open. Vite reloads the page when dashboard source files change, and the backend restarts when backend source files change.

## Available commands

| Command | What it does |
|---|---|
| `npm install` | Installs the project dependencies. |
| `npm run dev` | Starts the local Vite development server. |
| `npm run typecheck` | Checks TypeScript without building the site. |
| `npm run lint` | Checks the code for configured style and correctness problems. |
| `npm test` | Runs the automated tests once. |
| `npm run test:watch` | Reruns affected tests while files change. |
| `npm run build` | Type-checks and writes the production site to `dist`. |
| `npm run preview` | Serves the built `dist` files for a final local check. |

Run the complete validation set before pushing:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

To inspect the production build locally, set `VITE_API_URL` to an HTTPS non-localhost URL, run `npm run build`, then run `npm run preview`. The automated tests cover financial calculations used during dispute review. The production build rejects a missing or localhost API URL, preventing a deployment that silently calls the viewer's own computer.

## Which GitHub workflow should I pick?

Pick **GitHub Actions** as the GitHub Pages deployment source.

Do **not** select Jekyll, Static HTML, or a suggested starter workflow. This repository already contains the correct custom workflow at `.github/workflows/deploy-pages.yml`. It installs the project, builds the Vite site, uploads the `dist` directory, and deploys it to GitHub Pages.

The repository contains two workflows:

| Workflow shown in the Actions tab | Purpose |
|---|---|
| **CI** | Checks type safety, linting, tests, and the build. It does not publish the site. |
| **Deploy GitHub Pages** | Builds and publishes the dashboard. This is the deployment workflow. |

## First GitHub Pages deployment

### 1. Push the workflow to GitHub

Make sure the repository, including `.github/workflows/deploy-pages.yml`, is committed and pushed to the `main` branch. GitHub cannot display or run a workflow that exists only on your computer.

```powershell
git status
git add README.md .github/workflows
git commit -m "Document and configure GitHub Pages"
git push origin main
```

Only commit the files you intend to publish. If `git status` lists other work, review it before using `git add`.

### 2. Enable GitHub Actions if necessary

In the GitHub repository:

1. Open **Settings**.
2. In the left sidebar, open **Actions**, then **General**.
3. Under **Actions permissions**, keep the default option that allows actions, or choose an option that permits GitHub-created actions.
4. The supplied workflow uses official actions including `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
5. Under **Workflow permissions**, read-only repository contents is sufficient because `deploy-pages.yml` explicitly requests `pages: write` and `id-token: write`.
6. Save changes if GitHub shows a save button.

On a personal public repository, Actions is normally already enabled.

### 3. Add public production variables

The deployed dashboard cannot use `http://localhost:3000`. On GitHub's servers and in another person's browser, `localhost` means that other computer, not your development computer.

Deploy the backend to a public HTTPS address first. Then:

1. Open the GitHub repository's **Settings**.
2. Open **Secrets and variables**, then **Actions**.
3. Select the **Variables** tab.
4. Select **New repository variable**.
5. Enter the name `VITE_API_URL`.
6. Enter `https://backend.ruffl.thomaswhite.me`.
7. Select **Add variable**.

Use a repository **variable**, not a secret. This URL is compiled into public browser files and cannot be hidden.

Create a second repository variable named `VITE_SENTRY_DSN` after creating a separate Sentry browser/React project for the dashboard. Its value is the project's DSN, not a `sntryu_...` API token. The workflow creates `VITE_SENTRY_RELEASE` from the deployed Git commit SHA.

### 4. Select GitHub Actions for Pages

In the GitHub repository:

1. Open **Settings**.
2. In the left sidebar, open **Pages**.
3. Find **Build and deployment**.
4. Set **Source** to **GitHub Actions**.

If GitHub offers cards for Jekyll or Static HTML, ignore them. Do not create another workflow.

### 5. Run the deployment

Pushing to `main` automatically runs the deployment. You can also run it manually:

1. Open the repository's **Actions** tab.
2. Select **Deploy GitHub Pages** in the workflow list.
3. Select **Run workflow**.
4. Select the `main` branch.
5. Select the green **Run workflow** button.

The manual button appears only after the workflow containing `workflow_dispatch` is on the default branch. Refresh the page after pushing if it is not immediately visible.

Select the running job to watch each step. When it succeeds, the deployment page and **Settings > Pages** show the public URL.

## GitHub Pages URL and base path

Production uses `https://admin.ruffl.thomaswhite.me` at the domain root, so the workflow must keep:

```dotenv
VITE_BASE_PATH=/
```

Do not change it back to `/Ruffl-Admin-Dashboard/`. That repository path caused the custom-domain HTML to request `/Ruffl-Admin-Dashboard/assets/...`, while GitHub Pages served the files under `/assets/...`, producing the blank screen and 404 JavaScript/CSS responses.

If the custom domain is deliberately removed and the repository returns to a GitHub project-site URL, only then set the base to `/Ruffl-Admin-Dashboard/`.

## Configure backend CORS for the deployed dashboard

The backend must allow the dashboard's exact browser origin:

```dotenv
CORS_ORIGINS=https://admin.ruffl.thomaswhite.me
```

- Do not include `/Ruffl-Admin-Dashboard/` in `CORS_ORIGINS`; CORS uses the origin, not the page path.
- Add `http://localhost:5173` as a second comma-separated origin only when the production backend intentionally supports local dashboard development.
- Restart or redeploy the backend after changing its environment settings.
- The backend must use HTTPS when the dashboard uses HTTPS, or browsers will block the request as mixed content.

## How deployments and checks behave

- A push to `main` runs CI. The Pages workflow starts only after that exact commit succeeds.
- A pull request runs CI but does not deploy that branch.
- A failed CI workflow does not start a deployment.
- A failed Pages workflow leaves the previous successful Pages deployment in place.
- The deployment uses `npm ci`, which installs the exact versions recorded in `package-lock.json`.
- GitHub may require approval if protection rules were manually added to the `github-pages` environment.

## Moderation behaviour

- Warning, suspension, deletion, and restoration requests use a short-lived CSRF token obtained from the backend.
- **Anonymize account** removes login/profile identity irreversibly but retains shared commission, dispute, review, and message records needed by counterparties and for audit.
- The backend denies protected actions immediately after suspension or soft deletion, even if the affected app has not redrawn its screen yet.
- The mobile app polls account status and checks when returning to the foreground, so warnings and restrictions appear without a manual refresh.
- The backend remains the security boundary; visual updates are not relied upon for permission enforcement.

## Troubleshooting

- **No workflow appears in the Actions tab:** Confirm `.github/workflows/deploy-pages.yml` was committed and pushed to the default branch, then check **Settings > Actions > General**.
- **There is no Run workflow button:** The workflow must be on the default branch and contain `workflow_dispatch`. The supplied file does; push it and refresh GitHub.
- **GitHub asks which workflow to use:** Choose **GitHub Actions** as the Pages source, but do not generate a starter file. Use the included **Deploy GitHub Pages** workflow.
- **The deployment uses the wrong backend:** Check the repository variable is named exactly `VITE_API_URL`, then run a new deployment. Changing a variable does not rebuild an existing deployment.
- **The deployed login says something went wrong:** Confirm the public backend is running over HTTPS, inspect the browser Network tab, and check backend CORS and rate-limit logs.
- **The browser reports a CORS error:** Add the exact dashboard origin to backend `CORS_ORIGINS` and restart the backend. A URL path is not part of an origin.
- **A `DELETE` request fails during preflight:** Confirm the deployed backend contains the current CORS method configuration and was restarted after deployment.
- **The page is blank or assets return 404:** On the custom domain, confirm generated HTML uses `/assets/...` and the workflow still sets `VITE_BASE_PATH: /`.
- **Refreshing a dashboard route gives 404:** GitHub Pages is static hosting. This app should use its configured client-side routing/base behaviour; inspect the failed URL and the Vite base if a new route was added.
- **The workflow cannot deploy to Pages:** Check **Settings > Pages** uses GitHub Actions and that no unexpected `github-pages` environment protection rule is waiting for approval.
- **Local login returns 403:** Confirm the demo credentials, `SEED_DEMO_DATA=true`, and that the account has not been suspended or deleted.
- **Local login returns 429:** Too many attempts came from the same IP. Wait for the backend rate-limit window; during development, restarting the backend clears its in-memory limiter.
- **Port 5173 is already in use:** Vite may choose another port. Add that exact origin to backend `CORS_ORIGINS` or stop the other Vite process.

## Security notes and known boundaries

- Never store database passwords, JWT secrets, or service keys in `VITE_*` variables.
- Only trusted admin accounts should have access to this dashboard.
- Demo credentials and seeded accounts must be disabled in production.
- Browser prompts are used for the first moderation and adjudication input flow. Replace them with audited confirmation dialogs before production.
- Sentry code is installed, but no events can arrive until the `ruffl-admin-dashboard` Sentry project and `VITE_SENTRY_DSN` repository variable exist.
- Email and push delivery still depend on backend adapters that are not implemented.
- GitHub Pages hosts only the static dashboard. It does not host the Fastify backend or a database.
