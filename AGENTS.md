# Contributor Guide for ai-chatbotTHIsQORKS

This repository contains a feature-rich AI chatbot built with Next.js, using Drizzle ORM for the database, Playwright for testing and Stripe for subscriptions. Follow this guide when contributing either as a human developer or as an AI agent.

## Local Development Setup

1. **Start Services** - spin up PostgreSQL and Redis via Docker Compose:
   ```bash
docker compose -f docker-compose.dev.yml up -d
```
2. **Install Dependencies** - install all packages:
   ```bash
pnpm install
```
3. **Push Database Schema** - apply the Drizzle schema to your local database:
   ```bash
pnpm db:push
```
4. **Run Development Server** - launch the Next.js server with Turbopack:
   ```bash
pnpm dev --turbo
```

## Key Files and Directories

- **`/app`** – Next.js App Router code.
  - **`/app/(chat)`** – chat UI pages and API routes.
  - **`/app/(auth)`** – authentication configuration and pages.
  - **`/app/compare`** – page to compare model results.
  - **`/app/settings`** – user settings page.
- **`/lib`** – shared utilities and business logic.
  - **`/lib/db/schema.ts`** – single source of truth for the Drizzle schema.
  - **`/lib/ai`** – AI model helpers, prompts and tools.
- **`/tests`** – end-to-end Playwright tests.
- **`package.json`** – scripts and dependencies for the project.
- **`playwright.config.ts`** – Playwright configuration.

## Coding Standards and Conventions

- **Linting & Formatting** – run `pnpm lint` to check for issues and `pnpm format` to automatically format the code.
- **Database Schema** – all schema changes must be made in `lib/db/schema.ts`, followed by `pnpm db:generate`.

## How to Validate Changes (Testing)

Run the full test suite before committing:
```bash
pnpm test
```
This command runs the Playwright tests defined in `playwright.config.ts`. The workflow defined in `.github/workflows/playwright.yml` is the definitive CI process and must pass for all pull requests.

## Pull Request Instructions

- **Title Format** – `[type]: A brief but descriptive title`

