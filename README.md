# Ruffl admin dashboard

Ruffl Admin is a separate React/TypeScript web application for authorised support staff. It builds to static files and talks directly to `Ruffl-Backend`.

## What is implemented

- Admin-only login using the shared backend account system
- Marketplace totals and recent activity
- User search, status filtering, warnings, suspension/unsuspension, soft deletion, and guarded permanent deletion
- Read-only commission and value overview
- Dispute financial context, assignment, adjudication, and closure
- Admin support inbox
- Automatic short-lived CSRF token handling for every state-changing action
- Responsive desktop/mobile layout

## Install and run

Requirements: Node.js 20.19 or newer (Node 22 LTS recommended) and npm.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Start `Ruffl-Backend` first. Open the URL printed by Vite and use the local demo admin:

- Email: `admin@demo.ruffl`
- Password: `RufflDemo1!`

The backend must have `SEED_DEMO_DATA=true`. Never enable demo accounts in production.

## Test and build

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The tests cover the financial calculations used during dispute review.

## GitHub Pages

The included `deploy-pages.yml` workflow builds and deploys `main`.

1. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
2. Add an Actions variable named `VITE_API_URL` containing the public HTTPS backend URL.
3. Push to `main`.

The workflow uses `/Ruffl-Admin-Dashboard/` as the project-site base. For a custom subdomain, change `VITE_BASE_PATH` to `/` and add the required DNS/CNAME configuration in GitHub Pages.

## Known boundary

The support inbox lists admin conversations, but the conversation-detail/start-chat UI is not yet implemented. Browser prompts are used for the first moderation/adjudication input flow; replace them with audited confirmation dialogs before production. Email, push, file storage, and monitoring depend on backend external-service adapters and credentials.
