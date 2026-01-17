# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portal da Lembrança is a digital memorial platform built with Next.js 15. It serves funeral homes, family members, and public visitors, allowing them to create, manage, and view memorial pages with QR code integration.

**Migration Status**: Recently migrated from Vite to Next.js 15 (v2.0.0)

## Tech Stack

### ✅ Implemented
- **Language**: TypeScript 5.8.2
- **Framework**: Next.js 15.2.3 (App Router)
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 4.0.15
- **API Layer**: tRPC 11.0.0
- **Database**: PostgreSQL with Drizzle ORM 0.44.5
- **Auth**: Custom JWT (jose 6.1.0) with bcryptjs
- **State Management**: TanStack Query (React Query) 5.69.0
- **UI Components**: shadcn/ui + Radix UI
- **File Storage**: AWS S3
- **Testing**: Vitest 4.0.17 + React Testing Library 16.3.1
- **Mutation Testing**: Stryker 9.4.0
- **Containerization**: Docker (multi-stage builds)
- **Build Automation**: Make (GNU Make 4.x)
- **Package Manager**: pnpm 10.4.1

### ❌ Not Implemented (Planned)
- **E2E Testing**: Playwright/Cypress

## Common Commands

### Development
```bash
pnpm dev           # Start dev server with Turbopack at localhost:3000
pnpm build         # Production build (validates all routes and types)
pnpm start         # Start production server
pnpm preview       # Build and start production server
pnpm typecheck     # Run TypeScript type checking
```

### Testing
```bash
pnpm test              # Run tests in watch mode
pnpm test:run          # Run tests once (CI mode)
pnpm test:coverage     # Run tests with coverage report
pnpm test:ui           # Open Vitest UI for interactive testing
pnpm test:watch        # Run tests in watch mode (explicit)
pnpm test:mutate       # Run Stryker mutation testing
```

**Test Files**:
- Unit tests: `*.test.ts` or `*.spec.ts`
- Component tests: `*.test.tsx` or `*.spec.tsx`
- Located next to the file being tested

**Example tests**:
- `src/lib/utils.test.ts` - Utility function tests
- `src/components/ui/button.test.tsx` - React component tests

### Database
```bash
pnpm db:generate   # Generate migrations from schema changes in drizzle/schema.ts
pnpm db:migrate    # Apply pending migrations to database
pnpm db:push       # Push schema directly (dev only, bypasses migrations)
pnpm db:studio     # Open Drizzle Studio GUI at localhost:4983
```

**Important**: Always use `db:generate` then `db:migrate` for schema changes in production. Only use `db:push` for rapid local iteration.

### Make Commands

The project includes a Makefile for convenient command execution:

```bash
make help          # Show all available commands
make debug         # Start app locally with hot reload (pnpm dev)
make utest         # Run Vitest unit tests with output
make mtest         # Run Stryker mutation tests with score
make build         # Build Docker image
make run           # Start app in Docker container
make stop          # Stop Docker container
make logs          # Show Docker container logs
make clean         # Clean build artifacts and containers
```

**Requirements**:
- Make (GNU Make 4.x+)
- Docker (for Docker commands)

### Docker

The application is fully containerized with multi-stage Docker builds:

**Quick Start**:
```bash
# Build and run in one command
make run

# Or manually
docker build -t portaldalembranca-next .
docker run -d -p 3000:3000 --env-file .env --name portaldalembranca-app portaldalembranca-next
```

**Docker Configuration**:
- **Base Image**: node:20-alpine
- **Package Manager**: pnpm 10.4.1 (via corepack)
- **Build Type**: Multi-stage (deps → builder → runner)
- **Output**: Standalone Next.js build
- **Port**: 3000
- **User**: Non-root (nextjs:1001)
- **Health Check**: HTTP GET on localhost:3000

**Environment Variables for Docker**:
- Copy `.env.example` to `.env`
- Set required variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- Optional: `AWS_*`, `NEXT_PUBLIC_APP_URL`
- Pass to container via `--env-file .env` or individual `-e` flags

**Docker Files**:
- `Dockerfile` - Multi-stage production build
- `.dockerignore` - Excludes node_modules, .next, tests, etc.
- `next.config.js` - Configured with `output: "standalone"`

**Important**: The Next.js config includes `output: "standalone"` which bundles only necessary files for production, significantly reducing image size.

## Architecture

### Authentication System

The platform uses a custom JWT-based authentication with three distinct user types:

1. **Funeral Homes** (`funeralHomes` table)
   - Email/password authentication
   - OpenId format: `funeral-{id}`
   - Create and manage memorials
   - Invite family members

2. **Family Users** (`familyUsers` table)
   - Invitation-based registration with token
   - OpenId format: `family-{id}`
   - Edit assigned memorials only
   - Token expires after 7 days

3. **Admin Users** (`adminUsers` table)
   - System administration access
   - Manage production queue and leads
   - Access system-wide statistics

**OAuth Users** (`users` table) are supported for external OAuth integration but currently optional.

### tRPC Architecture

All API endpoints are defined in `src/server/routers.ts` (759 lines). The application uses tRPC 11 for type-safe APIs:

**Client-side usage** (React components):
```tsx
import { api } from "~/trpc/react";

function MyComponent() {
  const { data } = api.memorial.getBySlug.useQuery({ slug: "memorial-slug" });
  const createMutation = api.memorial.create.useMutation();
}
```

**Server-side usage** (RSC):
```tsx
import { api } from "~/trpc/server";

async function ServerComponent() {
  const memorial = await api.memorial.getBySlug({ slug: "memorial-slug" });
}
```

**Key routers** in `src/server/routers.ts`:
- `authRouter` - Login, registration, logout for all user types
- `memorialRouter` - CRUD operations for memorials
- `descendantRouter` - Manage children/grandchildren relationships
- `photoRouter` - Upload and manage memorial photos
- `dedicationRouter` - Public dedications/tributes
- `qrcodeRouter` - Generate QR codes (PNG/SVG)
- `dashboardRouter` - Stats and analytics
- `adminRouter` - Admin panel operations

**Authentication middleware**:
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user
- `adminProcedure` - Requires admin role

### Database Layer

**Schema source of truth**: `drizzle/schema.ts`

**Core relationships**:
```
funeralHomes (1) ── (N) memorials
familyUsers (1) ─── (N) memorials (via familyUserId)
memorials (1) ────── (N) photos
memorials (1) ────── (N) descendants
memorials (1) ────── (N) dedications
orders (1) ───────── (1) memorials
```

**Database helper functions** in `src/server/db.ts` (424 lines):
- `getDb()` - Lazy-load database connection
- `upsertUser()` - Insert or update OAuth user
- `getFuneralHomeByEmail()` - Lookup funeral home by email
- `getFamilyUserByEmail()` - Lookup family user by email
- `getMemorialBySlug()` - Get memorial with all relations
- Plus many more specific queries

**Important**: When adding new tables or columns:
1. Update `drizzle/schema.ts`
2. Run `pnpm db:generate`
3. Review generated SQL in `drizzle/migrations/`
4. Run `pnpm db:migrate`
5. Update TypeScript types (auto-inferred from schema)

### Middleware & Session Management

**Next.js Middleware** (`src/middleware.ts`):
- Protects routes: `/dashboard`, `/memorial/create`, `/profile`
- Redirects to `/login` if no session cookie
- Redirects to `/dashboard` if logged in user visits `/login` or `/register`

**Session flow**:
1. User logs in via tRPC mutation
2. `persistUserSession()` in `routers.ts` creates JWT token
3. Token stored in HTTP-only cookie named `session`
4. `createContext()` in `src/server/_core/context.ts` verifies token on each request
5. User object attached to tRPC context

**Session cookies**:
- Name: `session`
- Expires: 1 year (31,536,000,000 ms)
- HTTP-only: true
- SameSite: lax
- Secure: true (production only)

### File Upload Architecture

**AWS S3 integration** (`src/server/storage.ts`):
- Photos uploaded to S3 bucket
- Presigned URLs for secure uploads
- Environment variables required: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`

**Photo management**:
- Main photo: Direct URL stored in `memorials.mainPhoto`
- Gallery photos: Stored in `photos` table with `memorialId` foreign key
- QR codes: Generated on-demand, not stored

### QR Code Generation

**Module**: `src/server/qrcode.ts`

Two format options:
- PNG: `generateMemorialQRCode(slug)` - Returns Buffer
- SVG: `generateMemorialQRCodeSVG(slug)` - Returns string

QR codes link to: `${NEXT_PUBLIC_APP_URL}/memorial/${slug}`

### Component Structure

**shadcn/ui components** in `src/components/ui/`:
- 53 pre-built components (button, dialog, card, etc.)
- Built on Radix UI primitives
- Styled with Tailwind CSS 4

**Custom components** in `src/components/`:
- `theme-provider.tsx` - Dark mode support via next-themes
- Page-specific components (memorial forms, dashboards, etc.)

**Styling approach**:
- Tailwind CSS 4 with `@tailwindcss/postcss`
- CSS variables for theme colors in `src/styles/globals.css`
- Dark mode: `dark:` prefix, managed by theme-provider

### App Router Structure

```
src/app/
├── page.tsx                    # Landing page (public)
├── layout.tsx                  # Root layout with TRPCReactProvider
├── login/page.tsx              # Login for all user types
├── register/page.tsx           # Funeral home registration
├── dashboard/                  # Protected: user dashboard
├── memorial/
│   ├── [slug]/page.tsx         # Public memorial view
│   ├── create/page.tsx         # Protected: create memorial
│   └── [id]/edit/page.tsx      # Protected: edit memorial
├── admin/                      # Protected: admin panel
│   ├── dashboard/page.tsx
│   ├── orders/page.tsx         # Production queue
│   └── leads/page.tsx          # Contact requests
└── api/trpc/[trpc]/route.ts    # tRPC API endpoint
```

**Dynamic routes**:
- `[slug]` - Memorial slug (e.g., "joao-silva-1234567890-abc123")
- `[id]` - Numeric memorial ID for editing

### Environment Variables

**Required** (see `ENV_SETUP.md` for full details):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 256-bit secret for signing tokens (min 32 chars)
- `NODE_ENV` - development|test|production

**Optional**:
- `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` - External OAuth integration
- `AWS_*` - S3 file uploads
- `STRIPE_*` - Payment processing (future feature)
- `NEXT_PUBLIC_APP_URL` - Base URL for QR codes (defaults to localhost:3000)

**Validation**: Environment variables validated with Zod schemas via `@t3-oss/env-nextjs` in `src/env.js`.

## Key Implementation Patterns

### Creating a New tRPC Procedure

1. Add procedure to appropriate router in `src/server/routers.ts`:
```typescript
myNewProcedure: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    // ctx.user is guaranteed by protectedProcedure
    const data = await db.getDataById(input.id);
    return data;
  })
```

2. Use in React component:
```tsx
const { data } = api.myRouter.myNewProcedure.useQuery({ id: 123 });
```

### Adding a New Database Table

1. Define in `drizzle/schema.ts`:
```typescript
export const myTable = pgTable("my_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
export type MyTable = typeof myTable.$inferSelect;
export type InsertMyTable = typeof myTable.$inferInsert;
```

2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`
4. Add helper functions in `src/server/db.ts` if needed

### User Type Detection in Procedures

The `ctx.user` object from `protectedProcedure` has an `openId` field that identifies user type:

```typescript
const userType = ctx.user.openId.startsWith("funeral-")
  ? "funeral_home"
  : ctx.user.openId.startsWith("family-")
  ? "family_user"
  : "oauth_user";

// Get actual record
if (userType === "funeral_home") {
  const funeralHomeId = parseInt(ctx.user.openId.replace("funeral-", ""));
  const funeralHome = await db.getFuneralHomeById(funeralHomeId);
}
```

### Protected Routes & Redirects

Add routes to middleware if authentication is required:

```typescript
// src/middleware.ts
const protectedPaths = [
  "/dashboard",
  "/memorial/create",
  "/profile",
  "/your-new-route" // Add here
];
```

### Writing Tests

**Test file naming**: Place test files next to the code they test with `.test.ts` or `.test.tsx` extension.

**Unit test example** (testing utilities):
```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

**Component test example**:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("should render with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should handle clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

**Testing tRPC procedures**: Mock the database and context:
```typescript
import { describe, it, expect, vi } from "vitest";

// Mock database functions
vi.mock("~/server/db", () => ({
  getMemorialBySlug: vi.fn(),
}));

describe("memorial procedures", () => {
  it("should return memorial by slug", async () => {
    // Test implementation
  });
});
```

**Mocked Next.js APIs**: The test setup (`vitest.setup.ts`) automatically mocks:
- `next/navigation` - useRouter, usePathname, useSearchParams
- `next/headers` - headers(), cookies()

**Test coverage**: Run `pnpm test:coverage` to generate coverage report in `coverage/` directory.

**Mutation testing**: Run `pnpm test:mutate` to:
- Inject mutations into your code (change operators, remove conditions)
- Run tests against mutated code
- Report which mutations survived (weak tests)
- Thresholds: 80% high, 60% low, 50% break build

## Common Debugging

**Database connection issues**:
- Check `DATABASE_URL` in `.env`
- For production: ensure SSL with `?sslmode=require`
- Test connection: `pnpm db:studio`

**tRPC errors**:
- Development: Check terminal for detailed error logs
- Production: Errors are silent, check server logs
- Common: `UNAUTHORIZED` - missing/invalid session cookie
- Common: `FORBIDDEN` - insufficient permissions

**Session issues**:
- Cookie not persisting: Check `sameSite` and `secure` settings
- Session expired: JWT secret changed or token > 1 year old
- User not found: `openId` doesn't match any user in database

**Build failures**:
- Run `pnpm typecheck` to see TypeScript errors
- Check for missing environment variables
- Verify database connection during build (for dynamic imports)

## Documentation Files

- `README.md` - Comprehensive project overview and setup
- `ENV_SETUP.md` - Environment variable configuration
- `DATABASE_SETUP.md` - Database migration instructions
- `MIGRATION_CERTIFICATION.md` - Vite to Next.js migration audit
- `OAUTH_CONFIG.md` - OAuth setup (optional)
- `QUICK_WINS_SUMMARY.md` - Post-migration improvements

## Deployment

### Vercel (Recommended)

The application is optimized for Vercel deployment with Neon PostgreSQL.

**Quick Start**:
1. Push code to GitHub
2. Import repository to Vercel
3. Set environment variables (see VERCEL_DEPLOYMENT.md)
4. Deploy

**Key Configuration**:
- `output: "standalone"` in next.config.js
- Use Neon **pooled connection** (`-pooler` in hostname)
- Always include `?sslmode=require` for production
- Run migrations with **unpooled connection**

**Documentation**:
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Complete deployment guide
- [NEON_CONFIG_QUICK_REFERENCE.md](./NEON_CONFIG_QUICK_REFERENCE.md) - Neon database setup
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables

### Docker (Alternative)

For self-hosting or other cloud providers:

```bash
# Build and run
make run

# Or manually
docker build -t portaldalembranca-next .
docker run -d -p 3000:3000 --env-file .env portaldalembranca-next
```

See [DOCKER.md](./DOCKER.md) for detailed Docker deployment guide.

## Package Manager

**Always use pnpm** (not npm or yarn). Lock file: `pnpm-lock.yaml`.

If dependencies need to be updated, run:
```bash
pnpm install <package>@latest
```
