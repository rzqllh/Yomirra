# Yomirra

Yomirra is a premium, open-source manga and comic reader built with Next.js App Router. Designed for enterprise-grade performance and a pristine user experience, it features plug-and-play source adapters, seamless offline-first synchronization, and a meticulously crafted responsive UI.

## Features

- 📖 **Universal Source Adapters:** Extensible architecture supporting multiple manga sources with unified normalization.
- ⚡ **Premium UI & Motion:** Built with Tailwind CSS v4, shadcn/ui primitives, and `motion/react` for buttery-smooth micro-interactions.
- ☁️ **Offline-First Sync:** Powered by Firebase Firestore with IndexedDB persistence. Read offline, sync instantly when back online (POS-style background sync).
- 📱 **Adaptive Reader Modes:** Continuous vertical scroll and paged reading modes with directional support (LTR, RTL, Webtoon).
- 🛡️ **Enterprise Data Controls:** Built-in Data Saver (Next.js Image Edge optimization) and robust global NSFW Content Filtering.
- 🌙 **First-Class Dark Mode:** Deep integration with `next-themes` featuring a carefully curated, distraction-free color palette for reading.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Radix UI, Phosphor Icons
- **Animation:** Motion for React
- **State Management:** Zustand (with persist middleware)
- **Data Fetching:** React Query
- **Database & Sync:** Firebase (Auth, Firestore, Offline Persistence)

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/yomirra.git
   cd yomirra
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Firebase configuration keys.

4. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Building for Production

To build the application for deployment:

```bash
pnpm build
pnpm start
```

## Quality Assurance

Yomirra adheres to strict code quality standards:

- **Type Checking:** `pnpm typecheck`
- **Linting:** `pnpm lint`
- **Testing:** `pnpm test`

## License

This project is open-source and available under the [MIT License](LICENSE).
