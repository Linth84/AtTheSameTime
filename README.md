# AtTheSameTime

**Find the perfect time. Anywhere.**

AtTheSameTime is a timezone-aware availability coordination app for groups that need to find a shared time without manually converting schedules.

Create a poll, choose possible dates and a broad time window, share one link, and let each participant mark their availability in their own local timezone. AtTheSameTime stores the schedule in UTC, converts it for every participant, and highlights the strongest overlaps automatically.

## Why I built it

Scheduling across time zones is still unnecessarily awkward. People end up comparing screenshots, converting hours manually, or sending long lists of possible times through chat.

AtTheSameTime turns that process into one shared availability poll.

The project also gave me a practical way to work with timezone normalization, collaborative state, real-time updates, database security, responsive UI, and a strongly themed product interface.

## How it works

1. **Create a poll**  
   Add a title, an optional description, possible dates, and a broad daily time window.

2. **Share one link**  
   Every poll receives a unique URL. Participants do not need to create an account.

3. **Mark availability**  
   Participants join with their name and paint the 30-minute intervals that work for them.

4. **Find the overlap**  
   AtTheSameTime combines all responses and surfaces the strongest shared times.

## Features

- Multi-date availability polls
- 30-minute availability intervals
- Automatic browser timezone detection
- UTC-based time storage
- Local-time rendering for each participant
- Shareable poll URLs
- Account-free participation
- Click-and-drag availability painting
- Automatic saving
- Personal availability view
- Group availability view
- Best Matches calculation
- Participant response tracking
- Supabase Realtime updates
- Persistent participant sessions in local storage
- Responsive desktop/mobile behavior
- Custom steampunk / clockwork interface

## Timezone handling

Timezone support is part of the core architecture rather than a cosmetic feature.

The browser timezone is detected using the IANA timezone identifier. Local selections are converted to UTC before being stored in PostgreSQL. When another participant opens the poll, those same UTC timestamps are rendered in that participant's local timezone.

For example:

```text
America/Argentina/Buenos_Aires
21:00

Europe/Berlin
02:00 (+1 day)
```

Those values represent the same instant.

This means every participant can work entirely in their own local time while the application keeps one canonical timeline underneath.

## Real-time collaboration

Availability is stored per participant and synchronized through Supabase.

The group view can update as responses change, allowing the poll to show:

- who has responded
- each participant's availability
- overall group availability
- the strongest overlapping time slots

## Design

AtTheSameTime is presented as a **world-time synchronization machine** rather than a generic SaaS dashboard.

The visual system combines:

- Nixie-style local time tubes
- brass and iron machinery
- mechanical clocks
- pipes and gears
- an illuminated world globe
- engraved control plates
- instrument-style scheduling panels

The interface is deliberately tied to the product concept: a machine built to synchronize people in different places.

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Luxon
- CSS

### Backend

- Supabase
- PostgreSQL
- Supabase Realtime
- Row Level Security

### Deployment

- GitHub Pages
- GitHub Actions

## Data model

The core database structure is:

```text
events
├── event_windows
├── participants
└── availability
```

### `events`

Stores poll metadata such as title, description, creator timezone, unique slug, and ownership data.

### `event_windows`

Stores the UTC time ranges made available by the poll creator.

### `participants`

Stores people participating in a poll and their detected timezone.

### `availability`

Stores the UTC availability intervals submitted by each participant.

## Local development

Clone the repository:

```bash
git clone https://github.com/Linth84/AtTheSameTime.git
cd AtTheSameTime
```

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment files

Do not commit local environment files:

```text
.env
.env.local
.env.*.local
```

The browser may use the Supabase public/publishable key. Administrative secrets such as a Supabase service-role key must never be exposed in frontend code.

## Current status

The main scheduling flow is functional:

**Create poll → Share → Join → Mark availability → Compare overlap**

The project currently includes timezone-aware scheduling, real-time collaboration, participant persistence, and automatic overlap analysis.

## Roadmap

Possible next steps include:

- Preferred / Maybe availability states
- Poll deadlines
- Finalizing a selected meeting time
- Organizer controls
- Suggested meeting windows
- Timezone comparison tools
- Participant comments
- Stronger server-side authorization
- Transactional poll creation

## Author

**Edgardo Villalba**

Portfolio project focused on frontend product design, collaborative UX, timezone handling, real-time state, and Supabase-backed application architecture.

## Visual assets

The visual artwork and project-specific assets included in this repository are part of AtTheSameTime and should not be assumed to be independently reusable or redistributable unless explicitly stated otherwise.
