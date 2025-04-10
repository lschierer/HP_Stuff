# Vite SSR Project

This project demonstrates a Vite-based Server-Side Rendering (SSR) setup with TypeScript that clearly separates client and server code.

## Project Structure

```
src/
├── client/         # Code that runs only in the browser
│   └── entry-client.ts
├── server/         # Code that runs only on the server
│   ├── entry-server.ts
│   └── server.ts
├── shared/         # Code that runs on both client and server
│   └── app.ts
├── index.css       # Global styles
└── my-element.ts   # Lit component
```

## Code Execution Environment

- Files in `src/client/` run exclusively in the browser
- Files in `src/server/` run exclusively on the server
- Files in `src/shared/` run on both client and server

Each file includes console logs that clearly indicate where the code is running during development.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Building for Production

```bash
# Build both client and server bundles
pnpm build

# Preview the production build
pnpm serve
```

## How It Works

1. **Server-Side Rendering**: The server renders the initial HTML using `entry-server.ts`
2. **Client-Side Hydration**: The browser takes over with `entry-client.ts`
3. **Shared Code**: Components and logic in `shared/` work in both environments

## Customizing

- Add client-only code to the `client/` directory
- Add server-only code to the `server/` directory
- Add universal code to the `shared/` directory
