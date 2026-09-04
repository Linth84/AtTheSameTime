# AtTheSameTime

**Find the time that works for everyone.**

AtTheSameTime is a modern availability polling app designed to make scheduling across people and time zones simple.

Create a poll, choose the possible dates and time ranges, share the link, and let participants mark when they are available.

The app automatically displays times in each participant's local timezone and highlights the periods where the group overlaps the most.

---

## Features

- Create availability polls without requiring an account
- Select multiple possible dates
- Define availability time ranges
- Share polls through a unique link
- Join polls with a participant name
- Automatic timezone detection
- UTC-based time storage
- 30-minute availability slots
- Click and drag to mark availability
- Automatic availability saving
- Group availability visualization
- Availability intensity based on participant overlap
- Responsive interface
- Dark modern UI

---

## How it works

1. Create an availability poll.
2. Select the possible dates and general time range.
3. Share the generated link with the group.
4. Each participant joins using their name.
5. Participants mark the times when they are available.
6. AtTheSameTime compares everyone's availability.
7. The group can quickly identify the best overlapping times.

All dates are stored internally in UTC and converted to the local timezone of each participant.

---

## Tech Stack

- React
- TypeScript
- Vite
- Supabase
- PostgreSQL
- Luxon
- React Router
- CSS

Supabase provides the database, Row Level Security and realtime infrastructure.

---

## Timezone Support

Timezone handling is one of the core features of AtTheSameTime.

Instead of assuming that everyone participating in a poll is in the same location, AtTheSameTime stores time ranges in UTC and converts them when they are displayed.

For example:

```text
Buenos Aires     21:00
Berlin           02:00
New York         20:00
```

Each participant sees the same moment represented in their own local timezone.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/Linth84/AtTheSameTime.git
cd AtTheSameTime
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Start the development server:

```bash
npm run dev
```

---

## Environment Variables

The following environment variables are required:

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase browser publishable key |

Do not commit `.env.local` or private credentials to the repository.

---

## Project Structure

```text
src/
├── components/
│   ├── AvailabilityGrid.tsx
│   └── CreateEventForm.tsx
├── lib/
│   ├── hash.ts
│   └── supabase.ts
├── pages/
│   ├── EventPage.tsx
│   └── HomePage.tsx
├── App.tsx
└── main.tsx
```

---

## Roadmap

AtTheSameTime is currently under active development.

Planned features include:

- Best matching time suggestions
- Preferred and "maybe" availability states
- Poll deadlines
- Participant response tracking
- Finalize a selected meeting time
- Shareable final result
- Improved group availability heatmap
- Realtime collaborative updates
- Timezone comparison tools
- Mobile-focused availability selection
- Additional poll management controls

---

## Why AtTheSameTime?

Most availability tools solve the basic scheduling problem but often provide dated interfaces or awkward experiences when participants live in different time zones.

AtTheSameTime focuses on three things:

**Simple scheduling. Better timezone handling. Modern user experience.**

The goal is not just to collect availability, but to make it immediately clear when everyone can actually meet.

---

## Status

Work in progress.

The core availability polling flow is currently being developed and tested.