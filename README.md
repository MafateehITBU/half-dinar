# Abu Al-Nas (ابو النص) — E-Commerce Platform

Enterprise-grade daily-products store for **Jordan** (JOD), built on the PERN stack with a separate admin application.

| Item | Value |
|------|--------|
| Brand | Abu Al-Nas (ابو النص) |
| Market | Jordan |
| Languages | Arabic (default) + English |
| Payments | Cash on Delivery + Stripe (test) |

## Repository status

**Architecture & documentation complete — implementation not started.**

Always read **[PROJECT_MEMORY.md](./PROJECT_MEMORY.md)** first when continuing development in a new session.

## Documentation

| Document | Purpose |
|----------|---------|
| [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) | Living project brain — update after major work |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Data model |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | REST API outline |
| [SECURITY.md](./SECURITY.md) | Security practices |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Environments & VPS |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev workflow |

## Planned structure

```
apps/api          # Express + TypeScript
apps/storefront   # React customer site
apps/admin        # React admin (subdomain)
packages/shared   # Shared types & validators
```

## Stack

- **API:** Node.js, Express, PostgreSQL, Prisma, Redis, Meilisearch
- **Frontends:** React, TypeScript, Tailwind CSS, Framer Motion
- **Media:** Cloudinary (Multer uploads)
- **Email:** Gmail SMTP

## Local setup

Coming in Phase 1 scaffold (Docker Compose for Postgres, Redis, Meilisearch).

## License

Proprietary — Abu Al-Nas / client project.
