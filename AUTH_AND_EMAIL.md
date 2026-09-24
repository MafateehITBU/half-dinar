# Auth, Email & Google Sign-In — MawJooD

> **Last updated:** 2026-09-24  
> Use this doc when setting up Google Console, SMTP, or continuing account UX work.

---

## Goals (product)

| Feature | Status | Notes |
|---------|--------|--------|
| Email + password signup / login | ✅ Done | JWT access + refresh |
| Email verification | 🟡 Link only | Move to **6-digit code** (mobile-friendly) |
| Forgot / reset password | 🟡 Link flow live | Forgot page + login link deployed; OTP codes still planned |
| Order confirmation email | ✅ Done | Needs working SMTP |
| Order status update emails | ✅ Live | Designed RTL template on every admin status change (+ after MEPS paid) |
| Refund requests | ✅ Live | Customer form on order detail → Admin **الاسترداد**; Visa refund via PayTabs on approve |
| Saved addresses | ✅ Live | Account «العناوين» + checkout picker + CRUD API |
| Google Sign-In (Gmail) | ✅ Live | GIS on login; `POST /auth/google`; env on VPS |
| Easier signup | ✅ Live | Full name; softer password (8+ letter+number); Google CTA |
| Mobile-first auth / checkout / account | 🟡 Improved | Larger inputs, address chips, Google button |

---

## Email vs Google Sign-In (important)

These are **two different things**. Google’s “use Sign in with Google instead of App Passwords” message is about **people logging into apps**. It does **not** replace how **our server sends** order / verify / reset emails.

| Goal | Mechanism | Google Console? |
|------|-----------|-----------------|
| Customer **logs in** to MawJooD with Gmail | **Sign in with Google** (OAuth Client ID you created) | Yes — done |
| MawJooD **sends** email to customers | SMTP or a mail API (Resend / SendGrid / SES) | **No** Gmail API needed |

**Do not enable Gmail API** for this project.

### Why App Passwords feel “wrong”

Google discourages App Passwords for *user login*. Our API is not a user logging in — it is a **mail server client** posting messages. For that, either:

1. **Recommended (production):** a transactional provider (Resend, SendGrid, Amazon SES, Postmark, Mailgun), or  
2. **OK for start / low volume:** Gmail SMTP + **App Password** (needs 2-Step Verification on that mailbox).

“Sign in with Google” on the storefront **cannot** send order emails by itself.

### Option A — Recommended: Resend (or similar)

1. Create account at [resend.com](https://resend.com) (or SendGrid / SES).
2. Add + verify domain `mawjood.online` (DNS records they give you).
3. Create an API key → we wire it as e.g. `RESEND_API_KEY` / `EMAIL_FROM`.
4. No Gmail App Password needed.

Send us the API key + verified from-address when ready; we will switch the email service to that provider.

### Option B — Gmail SMTP + App Password (step by step)

Use this path for MawJooD transactional email (verify, reset, orders).

#### 1) Open the correct Google Account
1. Go to [myaccount.google.com](https://myaccount.google.com/) while signed in as the **mailbox that will send mail** (e.g. the address you want customers to see as From).
2. This is **not** Google Cloud Console — it is your personal/Google Account security page.

#### 2) Turn on 2-Step Verification
1. Left menu → **Security**.
2. Under “How you sign in to Google” → **2-Step Verification** → turn it **On**.
3. Finish the phone / prompt setup Google asks for.
4. Important: do **not** use “security keys only” mode if you want App Passwords to appear.

#### 3) Create an App Password
1. Still under **Security**, search the page for **App passwords**  
   (or open directly: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
2. You may be asked to sign in again.
3. **App name:** type `MawJooD SMTP` → **Create**.
4. Google shows a **16-character** password (often in 4 groups like `abcd efgh ijkl mnop`).
5. Copy it and remove spaces when pasting → `abcdefghijklmnop`.
6. You will not see this full password again — store it somewhere safe until it is on the server.

If **App passwords** is missing:
- 2-Step Verification is off, or
- Account is work/school (Workspace admin blocked it), or
- Advanced Protection / security-key-only  
→ Fix that first, or use another Gmail that allows App Passwords.

#### 4) Values to use in `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-full-gmail@gmail.com
SMTP_PASS=the16charapppassword
SMTP_FROM=MawJooD <your-full-gmail@gmail.com>
STOREFRONT_URL=https://mawjood.online
```

- `SMTP_USER` = full Gmail address  
- `SMTP_PASS` = App Password only (never your normal Gmail password)

#### 5) Put them on production (VPS)
1. SSH or ask us to set on the server file:  
   `/var/www/.../apps/api/.env` (production path used by deploy).
2. Paste the five `SMTP_*` lines (+ correct `STOREFRONT_URL`).
3. Restart API (PM2) so mail starts working.
4. Local `apps/api/.env` can use the same values for testing.

#### 6) Quick test
1. Register a new account on the store, **or** use Forgot password, **or** place a test order.
2. Check inbox (and Spam) for the email from that Gmail.
3. If nothing arrives: confirm App Password has no spaces, 2SV is on, and API was restarted after editing `.env`.

---

### Why mail goes to Spam (and how to fix it)

Using **Gmail App Password** (`mafateehjordanit@gmail.com`) works, but inbox providers often treat it as less trustworthy when:

| Cause | What happens |
|-------|----------------|
| From = `@gmail.com`, links = `mawjood.online` | Domain mismatch → Spam score ↑ |
| No SPF / DKIM / DMARC on **your** domain | Receivers cannot verify the shop owns the mail |
| New / low sending volume | No sender reputation yet |
| HTML + reset/order links | Looks like phishing to filters |

**Quick (customers / you):**
1. Open the message in Spam → **Not spam** / **Report not spam**.
2. Add `mafateehjordanit@gmail.com` to contacts.
3. In Gmail: create a filter → from that address → **Never send it to Spam**.

**Proper fix (recommended for production):**
1. Create mailbox or use a provider for **`noreply@mawjood.online`** (Google Workspace, or Resend / SendGrid).
2. Add DNS on `mawjood.online`: **SPF**, **DKIM**, **DMARC** (provider gives exact records).
3. Set `SMTP_FROM=MawJooD <noreply@mawjood.online>` (or Resend API).
4. Keep App Password Gmail only as a temporary bridge.

Until the domain is verified, some messages (especially password-reset) will keep hitting Spam for some users.

---

## Google Console — what to activate

For **Sign in with Google** you usually do **not** need extra APIs.

| Item | Action |
|------|--------|
| OAuth consent screen | **Publish** (In production) — you said this is done ✅ |
| OAuth Client ID (Web) | Created ✅ |
| Scopes | `openid`, `email`, `profile` only |
| Google Maps / Gmail / Drive / Calendar APIs | **Do not enable** — not needed for login |
| People API | Optional only; we get name + email from the ID token |
| Identity Toolkit / Firebase | **Not required** for our flow |

**Checklist right now:**
1. Consent screen status = **In production** (Published).
2. Credentials → your Web client → origins include `https://mawjood.online` and `http://localhost:5173`.
3. No other API library activation required.

---

## Credentials received (local only)

- Client ID + Secret saved in **gitignored** `apps/api/.env` and Client ID in `apps/storefront/.env` (`VITE_GOOGLE_CLIENT_ID`).
- **Never** commit these. Production VPS still needs the same `GOOGLE_*` vars when we deploy Sign-In.
- Because the secret was shared in chat, consider **rotating** it in Google Console → Credentials → reset secret after we finish wiring (optional but safer).

---

## What you need from Google Cloud Console

Follow these steps once. When finished, send the **Client ID** and **Client Secret** (or put them on the VPS `.env`) so we can wire Sign-In with Google.

### Step 1 — Open Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the Google account that will own the project (prefer a company / brand account, not a personal one if possible).

### Step 2 — Create or select a project

1. Top bar → **Select a project** → **New Project**.
2. Name: `MawJooD` (or `mawjood-store`).
3. Click **Create**, then select that project.

### Step 3 — Configure OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**.
2. User type: **External** → **Create**.
3. Fill:
   - **App name:** `MawJooD` / `موجود`
   - **User support email:** your email
   - **App logo:** optional (store logo)
   - **Application home page:** `https://mawjood.online`
   - **Authorized domains:** add `mawjood.online`
   - **Developer contact:** your email
4. **Save and Continue**.
5. **Scopes** → add:
   - `openid`
   - `email`
   - `profile`
6. **Save and Continue**.
7. **Test users** (while app is in Testing):
   - Add your Gmail and any team emails that should try login before public publish.
8. **Save and Continue** → back to dashboard.

> Later: when ready for all customers, click **Publish app** on the consent screen (may need Google verification if you request sensitive scopes — basic sign-in usually does not).

### Step 4 — Create OAuth Client ID (Web)

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `MawJooD Storefront`.
4. **Authorized JavaScript origins** (exact, no trailing slash):

   | Environment | Origin |
   |-------------|--------|
   | Production | `https://mawjood.online` |
   | Production www (if used) | `https://www.mawjood.online` |
   | Staging | `https://staging.mawjood.online` |
   | Local | `http://localhost:5173` |

5. **Authorized redirect URIs** (for server / GIS flows we use):

   | Environment | URI |
   |-------------|-----|
   | Production | `https://mawjood.online` |
   | Production (API callback, if used) | `https://api.mawjood.online/api/v1/auth/google/callback` |
   | Staging | `https://staging.mawjood.online` |
   | Staging API | `https://api.staging.mawjood.online/api/v1/auth/google/callback` |
   | Local | `http://localhost:5173` |
   | Local API | `http://localhost:4000/api/v1/auth/google/callback` |

6. Click **Create**.
7. Copy and store safely:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

Do **not** commit these to git. They go only in:

- Local: `apps/api/.env`
- Storefront (public Client ID only): `apps/storefront/.env` as `VITE_GOOGLE_CLIENT_ID=...`
- Production / staging VPS: `/var/www/.../apps/api/.env` (+ rebuild storefront with Vite env if needed)

### Step 5 — (Optional) Enable APIs

For Sign-In with Google (GIS / ID token), you usually do **not** need extra APIs beyond the OAuth client. If Google asks, enable **Google Identity** / **People API** only if a wizard suggests it.

### Step 6 — Hand off to engineering

Send (securely — chat / password manager, not a public issue):

```text
GOOGLE_CLIENT_ID=........apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-........
```

Also confirm which origins you added (prod / staging / local).

---

## Env vars (planned + existing)

### Email / SMTP (already in codebase)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # Gmail App Password, not account password
SMTP_FROM=MawJooD <noreply@mawjood.online>
STOREFRONT_URL=https://mawjood.online
```

**Gmail App Password steps:**

1. Google Account → **Security**.
2. Turn on **2-Step Verification**.
3. **App passwords** → create one named `MawJooD SMTP`.
4. Paste the 16-character password into `SMTP_PASS`.

### Google Sign-In (to add when implementing)

```env
# apps/api/.env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# apps/storefront/.env (Client ID only — safe to expose in browser bundle)
VITE_GOOGLE_CLIENT_ID=
```

---

## Implementation checklist (engineering)

Use this as the build order after keys arrive:

1. [ ] Confirm SMTP works (welcome / reset / order confirmation smoke test)
2. [ ] Forgot-password **page** + login link (token flow first)
3. [ ] Saved addresses CRUD API + Account tab + Checkout picker (mobile-first)
4. [ ] Order **status** update emails from admin status changes
5. [ ] Switch verify + reset to **6-digit OTP** (hashed, expiry, resend cooldown)
6. [ ] Google Sign-In: nullable `passwordHash`, `googleSub`, API verify ID token, Login button
7. [ ] Mobile polish: large OTP inputs, address chips, sticky CTAs, safe-area

---

## Related files (current)

| Area | Path |
|------|------|
| Auth service | `apps/api/src/application/services/auth.service.ts` |
| Auth routes | `apps/api/src/presentation/routes/auth.routes.ts` |
| Email | `apps/api/src/application/services/email.service.ts` |
| Email templates | `apps/api/src/application/services/email-templates.ts` |
| Address model | `apps/api/prisma/schema.prisma` → `Address` |
| Checkout save address | `apps/api/src/application/services/checkout.service.ts` |
| Verify UI | `apps/storefront/src/pages/VerifyEmailPage.tsx` |
| Reset UI | `apps/storefront/src/pages/ResetPasswordPage.tsx` |
| Account | `apps/storefront/src/pages/AccountPage.tsx` |
| Login | `apps/storefront/src/pages/LoginPage.tsx` |

---

## Security notes

- Never commit Client Secret or SMTP App Password.
- Hash OTP codes (same pattern as existing token hashes).
- Rate-limit verify / forgot / Google exchange endpoints (auth rate limits already exist).
- Google users: email from Google is treated as verified; still collect phone / age confirmation as required by checkout.
