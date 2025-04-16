# @hp-stuff/schemas

This package provides centralized Zod schemas for use across the HP-Stuff monorepo.

## Usage

Import schemas directly in your TypeScript files:

```typescript
// Import from the main package
import { FrontMatter, ParsedResult } from '@hp-stuff/schemas';

// Import from a specific subpath
import { GedcomSchema } from '@hp-stuff/schemas/gedcom';
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes during development
npm run dev
```

## Structure

- `index.ts` - Main entry point exporting all common schemas
- `gedcom/` - GEDCOM-specific schemas
- Other individual schema files for specific domains

## Note

This package is intended for internal use within the HP-Stuff monorepo only.
