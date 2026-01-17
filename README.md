# Portal da Lembrança - Next.js

Migrated to Next.js 15 with App Router, tRPC, and Drizzle ORM.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

## Deployment

This project is optimized for Vercel:

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

No `vercel.json` needed - just works! ✨

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **API**: tRPC 11
- **Database**: PostgreSQL + Drizzle ORM  
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: Custom JWT-based authentication
- **Deployment**: Vercel (zero-config)

## Migration from Vite

This project was migrated from Vite + React to Next.js:
- ✅ Zero module resolution issues
- ✅ Server-side rendering
- ✅ Automatic code splitting
- ✅ Better SEO
- ✅ Simpler deployment

