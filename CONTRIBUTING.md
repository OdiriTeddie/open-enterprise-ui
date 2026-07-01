# Contributing

Thanks for helping improve React UI Kit.

## Development

```bash
pnpm install
pnpm dev
```

The React Vite app is a local playground in `packages/react`. Package exports should come from `packages/react/src/index.ts`.

## Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Component Guidelines

- Keep components typed and generic where it improves reuse.
- Prefer small, composable APIs over page-specific abstractions.
- Keep styling predictable and easy to override.
- Avoid adding runtime dependencies unless the component clearly needs them.
- Include examples in the README when adding public components.

## Pull Requests

For bug fixes, include the problem and verification steps.

For new components or API changes, open an issue first so the shape can be discussed.
