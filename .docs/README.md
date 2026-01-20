# Documentation

This directory contains all project documentation organized by category.

## 📂 Directory Structure

```
.docs/
├── migration/      # Stripe to Mercado Pago migration documentation
├── setup/          # Setup and configuration guides
├── testing/        # Testing guides and results
├── deployment/     # Deployment and production guides
├── guides/         # Feature guides and how-tos
└── archive/        # Outdated or historical documentation
```

---

## 📁 Migration (`migration/`)

Documentation related to the Stripe to Mercado Pago payment migration.

- **FINAL_MIGRATION_STATUS.md** - Complete migration status and next steps
- **MIGRATION_COMPLETE.md** - Migration completion summary
- **MIGRATION_COMPLETE_GUIDE.md** - Step-by-step migration guide
- **MIGRATION_COMPLETE_SUMMARY.md** - Quick migration summary
- **MIGRATION_CERTIFICATION.md** - Migration certification document
- **MIGRATION_TODO.md** - Migration task checklist
- **MERCADOPAGO_MIGRATION_STATUS.md** - Detailed Mercado Pago status
- **CHECKOUT_IMPLEMENTATION_GUIDE.md** - Complete checkout implementation

**Start here**: `FINAL_MIGRATION_STATUS.md` or `MIGRATION_COMPLETE.md`

---

## ⚙️ Setup (`setup/`)

Initial setup and configuration documentation.

- **ENV_SETUP.md** - Environment variables configuration
- **DATABASE_SETUP.md** - Database setup and migrations
- **HTTPS_SETUP.md** - Local HTTPS setup for development
- **NEON_CONFIG_QUICK_REFERENCE.md** - Neon PostgreSQL configuration
- **OAUTH_CONFIG.md** - OAuth integration (optional)
- **DOCKER.md** - Docker setup and deployment

**Start here**: `ENV_SETUP.md` → `DATABASE_SETUP.md`

---

## 🧪 Testing (`testing/`)

Testing guides and test results.

- **TESTING_GUIDE.md** - Complete testing guide
- **TESTING_AND_DOCKER_SETUP.md** - Docker testing setup
- **TEST_RESULTS.md** - Latest test results

**Start here**: `TESTING_GUIDE.md`

---

## 🚀 Deployment (`deployment/`)

Production deployment documentation.

- **VERCEL_DEPLOYMENT.md** - Vercel deployment guide (recommended)
- **DEPLOYMENT_READY.md** - Production deployment checklist
- **POST_DEPLOYMENT_CHECKLIST.md** - Post-deployment verification

**Start here**: `VERCEL_DEPLOYMENT.md`

---

## 📖 Guides (`guides/`)

Feature guides and implementation documentation.

- **ADMIN_ACCESS.md** - Admin panel access and features
- **SUBSCRIPTION_SYSTEM.md** - Subscription system overview
- **HISTORIC_MEMORIALS_GUIDE.md** - Historic memorials feature
- **VISUAL_SHOWCASE.md** - Visual design showcase
- **CODE_EXAMPLES.md** - Code examples and snippets
- **IMPLEMENTATION_CHECKLIST.md** - Implementation checklist
- **QUICK_FIX_GUIDE.md** - Quick fixes and troubleshooting

**Browse as needed**

---

## 🗄️ Archive (`archive/`)

Outdated or historical documentation kept for reference.

- **STRIPE_PAYMENT_GUIDE.md** - Old Stripe integration (replaced by Mercado Pago)
- **AUTH_FIXES_SUMMARY.md** - Historical auth fixes
- **DATABASE_MIGRATION_FIX.md** - Historical DB migration fixes
- **DEBUG_HISTORIC_MEMORIALS.md** - Historical debugging notes
- **ENHANCEMENT_SUMMARY.md** - Historical enhancement notes
- **HISTORIC_MEMORIALS_ENHANCEMENT.md** - Historical feature notes
- **QUICK_WINS_SUMMARY.md** - Historical quick wins

**Reference only - may be outdated**

---

## 📋 Quick Start

### New Developer Setup

1. Read `../README.md` (project overview)
2. Follow `setup/ENV_SETUP.md` (environment variables)
3. Follow `setup/DATABASE_SETUP.md` (database setup)
4. Follow `setup/HTTPS_SETUP.md` (local HTTPS for payments)
5. Read `migration/MIGRATION_COMPLETE.md` (payment system)
6. Follow `deployment/VERCEL_DEPLOYMENT.md` (deployment)

### Payment Integration

1. Read `migration/FINAL_MIGRATION_STATUS.md`
2. Follow `migration/CHECKOUT_IMPLEMENTATION_GUIDE.md`
3. Setup HTTPS: `setup/HTTPS_SETUP.md`
4. Test payments with sandbox credentials

### Deployment

1. Read `deployment/VERCEL_DEPLOYMENT.md`
2. Complete `deployment/DEPLOYMENT_READY.md` checklist
3. After deployment: `deployment/POST_DEPLOYMENT_CHECKLIST.md`

---

## 📝 Documentation Standards

### Creating New Documentation

When creating new documentation:

1. **Choose the right directory**:
   - Migration: Payment system changes
   - Setup: Configuration and initial setup
   - Testing: Testing guides and results
   - Deployment: Production deployment
   - Guides: Feature documentation
   - Archive: Outdated docs

2. **Use clear file names**:
   - `FEATURE_NAME_GUIDE.md` for guides
   - `FEATURE_NAME_STATUS.md` for status updates
   - `FEATURE_NAME_CHECKLIST.md` for checklists

3. **Include standard sections**:
   - Overview/Summary
   - Prerequisites (if applicable)
   - Step-by-step instructions
   - Troubleshooting (if applicable)
   - Related documentation links

4. **Update this README**: Add your new doc to the appropriate section above

---

## 🔍 Finding Documentation

### By Topic

- **Payments**: `migration/FINAL_MIGRATION_STATUS.md`
- **Environment Variables**: `setup/ENV_SETUP.md`
- **Database**: `setup/DATABASE_SETUP.md`
- **Local Development**: `setup/HTTPS_SETUP.md`
- **Testing**: `testing/TESTING_GUIDE.md`
- **Deployment**: `deployment/VERCEL_DEPLOYMENT.md`
- **Admin Panel**: `guides/ADMIN_ACCESS.md`
- **Subscriptions**: `guides/SUBSCRIPTION_SYSTEM.md`

### By Task

- **Setting up locally**: `setup/` directory
- **Implementing payments**: `migration/` directory
- **Running tests**: `testing/` directory
- **Deploying to production**: `deployment/` directory
- **Learning features**: `guides/` directory

---

## 📦 Root Documentation

Some documentation remains in the project root:

- **README.md** - Main project overview (always in root)
- **CLAUDE.md** - Claude Code instructions (always in root)

---

## 🔄 Keeping Documentation Updated

- Archive outdated docs to `archive/`
- Update this README when adding new docs
- Keep file names descriptive and consistent
- Cross-reference related documentation
- Date-stamp status documents

---

## 📞 Need Help?

1. Check the relevant guide in this directory
2. Search for keywords across all docs
3. Review `archive/` for historical context
4. Check the main `../README.md` for project overview

---

**Last Updated**: 2026-01-20
**Total Documents**: 35 files organized across 6 directories
