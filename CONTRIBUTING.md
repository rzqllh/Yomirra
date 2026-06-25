# Contributing to Yomirra

First off, thank you for considering contributing to Yomirra! It's people like you that make Yomirra such a great tool.

## Getting Started

1. Fork the repository and create your branch from `main`.
2. Follow the setup instructions in the `README.md`.
3. Read the documentation in `docs/` carefully before starting your work.
   - **Crucial**: Review `docs/ARCH.md` to understand layer boundaries.
   - **Crucial**: Review `docs/COMPONENTS.md` before building new UI.

## Code Conventions

- **Package Manager**: Use `pnpm`. Do not use `npm` or `yarn`.
- **Styling**: We use Tailwind v4 via CSS variables. Refer to `docs/DESIGN.md`. Do not hardcode hex colors or arbitrary spacing.
- **State Management**: We use Zustand. Review `docs/SCHEMA.md` to see existing stores before adding local state for global data.
- **Client vs Server**: Adhere to the App Router boundaries. Keep Firebase and Zustand purely client-side. Server components should only handle initial data fetching.
- **Types**: Use TypeScript strictly. No `any` without a valid reason and an `eslint-disable` comment. Use Zod for API boundaries.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. Your code MUST pass the following checks:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test --run
   pnpm build
   ```
4. Describe your changes clearly in your Pull Request description.
5. You may merge the Pull Request once you have the sign-off of at least one core developer.
