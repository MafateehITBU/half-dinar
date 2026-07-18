# DNS — abualnus.com (Hostinger / your DNS panel)
#
# Point these A records to the VPS before Certbot can issue SSL.
#
# | Type | Host  | Value           | TTL  | Purpose              |
# |------|-------|-----------------|------|----------------------|
# | A    | @     | 46.202.153.60   | 300  | Storefront (apex)    |
# | A    | www   | 46.202.153.60   | 300  | Storefront www       |
# | A    | admin | 46.202.153.60   | 300  | Admin dashboard      |
# | A    | api   | 46.202.153.60   | 300  | API + Stripe webhooks|
#
# URLs after SSL:
#   https://abualnus.com          → customer storefront
#   https://www.abualnus.com      → same (optional redirect)
#   https://admin.abualnus.com    → dashboard
#   https://api.abualnus.com      → REST API
