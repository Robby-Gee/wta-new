# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WTA Fantasy League - A fantasy sports web app for women's tennis where users draft WTA players and earn points based on match results.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS

## Common Commands

```bash
# Install dependencies
npm install

# Set up database (after configuring .env)
npx prisma db push
npx prisma generate

# Run development server
npm run dev

# Open Prisma Studio (database GUI)
npm run db:studio

# Build for production
npm run build
```

## Architecture

### Scoring System (lib/scoring.ts)

- Player costs based on WTA ranking (1-2: 13pts, 3-5: 11pts, etc.)
- Round points: R1=0, R2=3, R3=6, R4=8, QF=10, SF=14, F=18, W=24
- Tournament allowances: WTA 500=+8, WTA 1000=+10, Grand Slam=+12
- Starting budget: 50 points

### Key Routes

- `/` - Landing page
- `/dashboard` - User dashboard with budget and picks
- `/tournaments` - List of all tournaments
- `/picks/[tournamentId]` - Make picks for a tournament
- `/leaderboard` - Global rankings
- `/admin/*` - Admin panel (requires isAdmin flag)

### Database Models

- **User**: Players with budget tracking
- **Tournament**: WTA 500/1000/Grand Slam with status
- **Player**: WTA players with rankings and costs
- **Pick**: User selections per tournament
- **Match**: Results that trigger point calculations

### Admin Workflow

1. Add players via Admin > Players (bulk add supported)
2. Create tournaments via Admin > Tournaments
3. Start tournament when it begins (locks picks)
4. Enter match results via Admin > Results (auto-updates user points)
5. Mark tournament complete when finished
