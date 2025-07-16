# Contributor & Agent Guide for ai-chatbotTHIsQORKS

This document provides the definitive rules and context for any contribution to this repository. All contributors, human or AI, must adhere to these guidelines.

---

## 1. Agent Core Directives & Rules of Engagement

This is the most important section. Read and adhere to these rules before any other action.

### The Golden Rule: Do NOT Run Tests in the Environment

Your assigned cloud environment is for code generation and static analysis only. It is **not** configured to run our full test suite (`pnpm test`), which requires a complex local setup with Docker services (`docker-compose.dev.yml`) that are not present in your sandbox.

> **Attempting to run `pnpm test` is a waste of time and will fail due to database errors.**

### Mandatory Validation Steps

Before committing any changes, you **must** perform the following static analysis checks to ensure code quality and prevent regressions. These are your primary methods for verifying your work:

1.  **Linting & Formatting:** Run `pnpm lint`. You must fix all reported errors.
2.  **Type Checking:** Run `pnpm tsc --noEmit`. The project must have zero TypeScript errors.

Only after these two commands pass successfully can you proceed.

### Proactive Self-Correction Mandate

Before finalizing your work, you must follow this three-step self-correction loop:

1.  **Review the Prompt:** Re-read the user's request. Have you addressed every single requirement, both explicit and implicit?
2.  **Triple-Check Your Changes:** Scrutinize your own code. Does it follow the project's coding standards? Have you added necessary dependencies to `package.json`? Have you considered edge cases and potential side effects of your changes?
3.  **Anticipate Needs:** Actively consider what might be missing to make a feature truly complete. If a user asks for a new component, have you also added the necessary import statements, API routes, or type definitions to make it fully functional? Add these logical next steps proactively.

---

## 2. Project Vision & Strategy

### Mission
Our mission is to build a premier AI platform with two distinct audiences. The ultimate deployment target for this application is **AWS**, so all code should be professional, scalable, and robust.

1.  **Consumer Platform:** To provide individual users with a best-in-class, intuitive, and powerful chat interface for interacting with various AI models.
2.  **Business Hub (Future Vision):** To create a professional, user-friendly hub for companies to manage, monitor, and analyze their AI usage and internal tools. This audience demands a polished, reliable, and professional look and feel.

### Design Philosophy

The design must be slick, modern, and user-friendly, blending the intuitive usability of **OpenAI's interfaces** with the minimalist and premium aesthetic of **Apple's design language**.

-   **Principle 1: Modern & Minimalist:** Every element must be purposeful. Focus on exceptional typography, generous spacing, and a clean layout. Reduce visual clutter relentlessly.
-   **Principle 2: Intuitive & Fluid:** Interactions should feel natural and delightful. Use subtle animations and transitions to guide the user and provide feedback.
-   **Principle 3: Theme Consistency:** All new UI components and design changes **must** work flawlessly and look aesthetically pleasing across all three existing themes: **light**, **dark**, and **orange**.

### Localization

The application must be fully compatible with both **English (en)** and **Dutch (nl)**. All user-facing text strings must be implemented via the project's i18n system, configured in `/lib/i18n.tsx`. Do not hardcode user-facing text in components.

---

## 3. Technical & Contribution Guidelines

### Tech Stack Overview
-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Package Manager:** pnpm
-   **Database:** PostgreSQL with Drizzle ORM
-   **Testing:** Playwright (for human developers)
-   **Styling:** Tailwind CSS with shadcn/ui
-   **Authentication:** NextAuth.js
-   **Payments:** Stripe

### Local Development (For Human Reference)
To set up the project locally, start services with `docker-compose`, install dependencies with `pnpm install`, and push the database schema with `pnpm db:push`.

### Pull Request Instructions
-   **Title Format:** `[type]: A brief but descriptive title`
-   **Types:** `feat`, `fix`, `refactor`, `test`, `docs`.
