# ClientHub — Client Portal + Agency CRM (live demo)

Portfolio demo by **AI Digital Marketing**. Sample data only — no real clients, projects or payments.

- **Landing page:** hero with live dashboard mockup, features, how it works, demo tour, sample pricing, contact form (lead to email) and WhatsApp.
- **Agency dashboard:** KPIs, project overview and status charts, recent activity, tabbed tables, client messages, payment overview; clients, projects, drag-and-drop tasks, messages (AI reply drafts), files with approvals, invoices, AI proposals, support tickets, team workload, reports with CSV export, settings.
- **Client portal:** overview, projects with milestones, files to approve/upload, invoices with a demo "Pay now" (no card details), messages to the project manager, and an AI project assistant. Mobile bottom navigation.
- Everything is connected: a client payment, approval or message shows up in the agency dashboard instantly.
- English, Arabic (RTL) and Urdu (RTL); light/dark; mobile-friendly.

## Deploy
Static site + Vercel functions (`/api/chat`, `/api/health`). Optional env var in Vercel: `GEMINI_API_KEY` (and/or `GROQ_API_KEY`). Without a key the AI features use built-in replies.
