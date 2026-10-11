# Supabase Auth: production email setup

Custom SMTP through Resend is configured (verified 2026-10-11: confirmation and
password-reset emails are delivered). Two dashboard settings remain, without
which every email link points at `http://localhost:3000`.

## 1. URL configuration (required)

Supabase dashboard → Authentication → URL Configuration

- **Site URL:** `https://www.tractorauction.com`
- **Redirect URLs** (add all):
  - `https://www.tractorauction.com/**`
  - `https://tractorauction.com/**`
  - `http://localhost:3000/**` (local development)

## 2. Email templates (strongly recommended)

Supabase dashboard → Authentication → Email Templates. Replace the link in each
template so it works on any device (the default link only works in the browser
that requested it, so someone who signs up on a laptop and opens the email on a
phone would be refused).

**Confirm signup**, the link becomes:

```
{{ .SiteURL }}/callback?token_hash={{ .TokenHash }}&type=email&next=/account/watchlist
```

**Reset password**, the link becomes:

```
{{ .SiteURL }}/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

Example body for both:

```html
<h2>Confirm your email</h2>
<p>Follow this link to finish creating your TractorAuction.com account:</p>
<p><a href="{{ .SiteURL }}/callback?token_hash={{ .TokenHash }}&type=email&next=/account/watchlist">Confirm my email</a></p>
```

`/callback` (src/app/(auth)/callback/route.ts) accepts both this link and the
default one, so changing templates is safe at any time.

## 3. Check it

Sign up with a real inbox, open the confirmation email on a different device,
and confirm it lands on the watchlist signed in. Then use "Forgot password?"
and confirm the link opens the new-password form.
