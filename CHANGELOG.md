# Changelog

All notable changes to the Abu Al-Nas (half-dinar) platform.

## [Unreleased]

### Docs
- Added `AUTH_AND_EMAIL.md`: Google Cloud Console step-by-step, SMTP App Password, feature status (addresses, OTP, status emails, Google Sign-In)
- Linked from README; Google + SMTP placeholders in `apps/api/.env.example`

### Added
- Sprint 1 catalog: categories (nested CRUD), products CRUD, tags list
- Meilisearch indexing + `/search` + `/search/suggest`
- Guest cart with Redis/cookie + `/cart/merge` on login
- Cloudinary upload endpoint (when configured)
- Sample catalog seed (4 products, 3 categories)
- Storefront: store filters, product detail, cart, login/register
- Admin: login, categories page, products page

### Pending
- OpenAPI/Swagger live spec
- Postman collection export
- Docker Compose files
- Google Sign-In, OTP verify/reset, saved-address UI, order status emails (see AUTH_AND_EMAIL.md)

## [0.0.0] - 2026-06-04

- Initial repository with README placeholder
