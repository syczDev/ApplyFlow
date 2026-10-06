# ApplyFlow

Track job applications, interviews, contacts, and follow-ups in one place.

ApplyFlow is a responsive job application tracker built with **React 19**, **TypeScript**, and **Vite**. It runs entirely in your browser. There's no backend, no account, and no paid API: your data is saved to `localStorage`, so it's still there after a refresh.

## Features

- **Track every application** with its company, role, date applied, status, job link, contact, next follow-up date, and notes.
- **Add, edit, and delete** applications through an accessible dialog form. The form checks your input as you go: company, role, and date applied are required, dates must be real, and job links must be `http(s)` URLs. A bare domain like `jobs.example.com/123` gets `https://` added for you.
- **Change status in one step.** Each card has a status dropdown, so you can move an application along (Saved → Applied → Interviewing → Offer / Rejected / Withdrawn) without opening the edit form.
- **Search** by company, role, contact, or notes. Press <kbd>Esc</kbd> in the search box to clear it.
- **Filter by status** with chips that show how many applications have each status. Search and filters work together.
- **Sort** by newest or oldest applied, next follow-up, or company A–Z.
- **Summary dashboard:**
  - Totals for all applications, active, interviewing, offers, interview rate, and follow-ups due
  - A "pipeline by status" breakdown. Click a row to filter the list to that status.
  - An "upcoming follow-ups" list, with overdue items flagged. Click an item to edit it.
- **Follow-up reminders:** an overdue follow-up shows up on its card and on the dashboard. Rejected and withdrawn applications are left out.
- **Clear empty states:**
  - A first-run screen with a **Try with sample data** button
  - A "no matching applications" message with a one-click reset when search or filters hide everything
  - An empty follow-ups panel
- **Persistent and safe storage:**
  - Saved data is checked when it loads, and broken records are fixed or skipped.
  - If the stored data can't be read, ApplyFlow shows a warning and leaves it alone instead of overwriting it.
  - If a save fails (for example, the storage quota is full), you see a message.
  - Changes made in another open tab show up automatically.
- **Responsive:** the layout works from a 320px phone up to a wide desktop. On small screens the form opens full-screen.
- **Accessible:**
  - Uses semantic landmarks and headings, and has a skip link.
  - Dialogs are native `<dialog>` elements: focus stays inside them, <kbd>Esc</kbd> closes them, and focus returns to the button that opened them.
  - Form errors are linked to their fields with `aria-describedby`, and focus moves to the first invalid field.
  - Screen readers announce confirmations through a live region.
  - Status is always shown as text, never by color alone. Every icon-only button has a label.
  - Focus is always visible and touch targets are at least 44px.
  - Supports light and dark mode (follows your system setting), `prefers-reduced-motion`, and Windows high-contrast (`forced-colors`) mode.

## Getting started

**Requirements:** Node.js 20.19+ or 22.12+ (needed by Vite 8) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev
```

### Other scripts

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run build`     | Type-checks and builds a production bundle in `dist/` |
| `npm run preview`   | Serves the production build locally                   |
| `npm test`          | Runs the unit tests (Vitest)                          |
| `npm run test:watch`| Runs tests in watch mode                              |
| `npm run lint`      | Lints with oxlint                                     |
| `npm run typecheck` | Type-checks without building                          |

### Deploying

`npm run build` produces a fully static site in `dist/`. You can host it on any static host, such as GitHub Pages, Netlify, Vercel, Cloudflare Pages, or S3. You don't need any server or environment variables.

## Your data

- Applications are stored in your browser's `localStorage` under the key `applyflow:applications:v1`.
- Data stays on your device and is never sent anywhere. It's tied to this browser and site, so it doesn't sync between devices or browsers.
- Clearing your browser's site data deletes it. So does **Clear all data** in the footer.

## Project structure

```
src/
├── App.tsx                  # Page layout, dialogs, search/filter/sort state
├── main.tsx                 # Entry point
├── index.css                # Design tokens (light/dark), layout and components
├── types.ts                 # JobApplication model and status definitions
├── components/
│   ├── ApplicationCard.tsx  # One application, with inline status change
│   ├── ApplicationForm.tsx  # Add/edit form with validation
│   ├── ConfirmDialog.tsx    # Delete / clear-all confirmation
│   ├── Dashboard.tsx        # Stat tiles, status pipeline, follow-ups
│   ├── EmptyState.tsx
│   ├── Icons.tsx            # Inline SVG icons
│   ├── Modal.tsx            # Native <dialog> wrapper
│   ├── StatusBadge.tsx
│   ├── Toast.tsx            # Visible toast and screen-reader live region
│   └── Toolbar.tsx          # Search, status filters, sort
├── hooks/
│   ├── useApplications.ts   # State, localStorage persistence, cross-tab sync
│   └── useToday.ts          # Current local date, refreshed past midnight
└── lib/
    ├── applications.ts      # Filtering, sorting, stats, validation (pure functions)
    ├── dates.ts             # Timezone-safe YYYY-MM-DD helpers
    ├── sampleData.ts        # Demo data for the empty state
    └── storage.ts           # Load, check, and save localStorage data
```

Dates are stored as plain `YYYY-MM-DD` calendar dates and read in local time. This keeps "applied on" and "follow up on" from moving by a day in different time zones.
