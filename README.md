<div align="center">
  <img src="public/screenshots/desktop-library.png" alt="Yomirra Desktop" width="100%" />
</div>

<br />

<div align="center">
  <strong>A premium, webtoon-first manga reader built for the modern web.</strong>
</div>

<br />

Yomirra is a progressive web application (PWA) designed to provide a cinematic, seamless reading experience. Built with a custom "Deep Lagoon" design language, it prioritizes performance, offline capabilities, and fluid interactions through native View Transitions and motion physics.

## 🚀 Features

- **Webtoon-First Vertical Reader:** Continuous, uninterrupted scrolling optimized for long-strip manhwa and webtoons.
- **Extensible Source System:** Built with an adapter pattern to easily integrate new manga sources via API proxies (ships with Shinigami adapter).
- **Progressive Web App (PWA):** Installable on mobile and desktop, featuring offline caching and native-like shortcuts powered by Serwist.
- **Cross-Device Sync:** Firebase-powered authentication and state synchronization for your library, history, and bookmarks.
- **Fluid UI/UX:** Advanced micro-interactions, spring-based physics, and native View Transitions for seamless navigation without jarring page loads.
- **Accessibility & Performance:** Reduced motion support, dynamic layout adaptations, and optimized asynchronous image decoding.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack) & React 19
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (Local + Cloud Sync)
- **Animations:** Framer Motion (v12) & View Transitions API
- **Backend & Auth:** Firebase (Auth, Firestore)
- **PWA:** Serwist
- **Components:** Radix UI primitives & Phosphor Icons

## 📱 Previews

<div align="center">
  <img src="public/screenshots/mobile-home.png" alt="Mobile Home" width="30%" />
  &nbsp;&nbsp;&nbsp;
  <img src="public/screenshots/mobile-reader.png" alt="Mobile Reader" width="30%" />
</div>

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- `pnpm` (recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rzqllh/Yomirra.git
   cd Yomirra
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in your Firebase credentials.
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   pnpm dev --turbo
   ```

## 🏗 Architecture

Yomirra is structured around a strict separation of concerns to maintain a scalable codebase:

- `/src/app`: Next.js App Router definitions, layouts, and API routes.
- `/src/components`: Highly cohesive UI components, divided by domain (`/manga`, `/reader`, `/source`, `/ui`).
- `/src/shared`: Core business logic, including Zustand stores, Firebase hooks, and utility functions.

### Source Adapter Pattern
The application uses a server-side proxy architecture to fetch from various external websites. This avoids CORS issues and abstracts DOM parsing into standardized interfaces (`fetchPopular`, `fetchMangaDetail`, `fetchChapterPages`), making it trivial to add new scrapers in the future without touching the frontend logic.

## 📄 License

This project is open-sourced under the Apache 2.0 License.
