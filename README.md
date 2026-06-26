# Yomirra

A mobile-first PWA Manga/Webtoon Reader built with Next.js 16, React 19, Tailwind v4, Zustand v5, and Firebase.

## Features

- **PWA Ready**: Installable on mobile and desktop, works offline.
- **Dynamic Sources**: Fetch manga from various sources dynamically.
- **Offline Reading**: Download chapters for offline reading (cached via Service Worker).
- **History & Bookmarks**: Sync reading history and bookmarks across devices via Firebase.
- **Customizable Reader**: Vertical scrolling (Webtoon mode), tap-to-scroll, and customizable reading settings.
- **Unified Search & Library**: Multi-source global search and library browsing with advanced pagination, filters (genre, format, status), and seamless view modes.
- **Premium UI/UX**: Features fluid View Transitions, Bento Grid layouts, and high-end animations powered by Motion.
- **Performance Tracking**: Integrated with Vercel Speed Insights for real-time performance monitoring.

## Tech Stack

- **Framework**: Next.js (App Router, View Transitions enabled)
- **UI & Styling**: React 19, Tailwind CSS v4, Framer Motion, Phosphor Icons
- **State Management**: Zustand
- **Backend/DB**: Firebase (Firestore, Auth)
- **Deployment**: Vercel

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rzqllh/Yomirra.git
   cd Yomirra
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Firebase credentials and external API keys.
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

   The app will be running on [http://localhost:3000](http://localhost:3000).

## Architecture

Please read the documentation in the `docs/` directory for detailed architecture, stack decisions, and UI patterns:
- [`docs/ARCH.md`](docs/ARCH.md): Architecture and Data Flow
- [`docs/STACK.md`](docs/STACK.md): Technical Stack & Constraints
- [`docs/SCHEMA.md`](docs/SCHEMA.md): Data Schema and State Management
- [`docs/DESIGN.md`](docs/DESIGN.md): Design System Tokens
- [`docs/COMPONENTS.md`](docs/COMPONENTS.md): Reusable UI Components
- [`docs/SOURCES.md`](docs/SOURCES.md): Source Adapter Implementation Guide
- [`docs/PRD.md`](docs/PRD.md): Product Requirements and Feature Status

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Security

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting and security policies.
