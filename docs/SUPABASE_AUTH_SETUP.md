# Supabase Auth: production email setup

| Step | Status |
|---|---|
| Custom SMTP through Resend | Done. Confirmation and reset emails verified delivered (2026-10-11). |
| Site URL and redirect URLs | Done. Email links return to `https://www.tractorauction.com/callback` (verified 2026-10-11). |
| Email templates below | **To do.** Makes every link work on any device. |

## Why the templates matter

Supabase's default links use a one-time code that can only be redeemed in the
browser that asked for the email. Someone who signs up on a laptop and taps the
link on their phone gets "This link must be opened in the same browser". The
templates below use `token_hash` links instead, which the site verifies on the
server, so they work on any device. `/callback`
(`src/app/(auth)/callback/route.ts`) accepts both kinds, so the templates can be
changed at any time without breaking links already sent.

Links use the full address `https://www.tractorauction.com` rather than
`{{ .SiteURL }}`, so they do not depend on how the Site URL is typed (it is
currently saved with a trailing slash, which would produce `//callback`; that
still works through a redirect, but the full address avoids the extra hop).

## How to paste them

Supabase dashboard → Authentication → Email Templates. For each template below,
open its tab, set the **Subject**, paste the **Message body** (switch the editor
to source/HTML if it offers one), and **Save**. Only the first two are used by
the site today; the other two are ready if invites or email changes are ever
turned on.

---

### 1. Confirm signup (required)

**Subject**

```
Confirm your TractorAuction.com account
```

**Message body**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1d1e">
  <div style="background:#1D552B;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="color:#ffffff;font-size:20px;font-weight:bold">TractorAuction.com</span>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px;font-size:20px">Confirm your email address</h2>
    <p style="margin:0 0 20px;line-height:1.5">Thanks for signing up. Confirm this email address to save auctions to your watchlist, save searches and get alerts.</p>
    <p style="margin:0 0 24px">
      <a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=email&next=/account/watchlist"
         style="display:inline-block;background:#1D552B;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px">Confirm my email</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280">If the button does not work, copy this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=email&next=/account/watchlist" style="color:#1D552B">https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&amp;type=email&amp;next=/account/watchlist</a></p>
    <p style="margin:0;font-size:13px;color:#6b7280">If you did not create an account, you can ignore this email.</p>
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center">TractorAuction.com is a search and aggregation platform. We are not the auctioneer, seller, or bidding platform.</p>
</div>
```

### 2. Reset password (required)

**Subject**

```
Reset your TractorAuction.com password
```

**Message body**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1d1e">
  <div style="background:#1D552B;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="color:#ffffff;font-size:20px;font-weight:bold">TractorAuction.com</span>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px;font-size:20px">Reset your password</h2>
    <p style="margin:0 0 20px;line-height:1.5">We received a request to reset the password for this account. Choose a new one with the button below. The link works once.</p>
    <p style="margin:0 0 24px">
      <a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
         style="display:inline-block;background:#1D552B;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px">Choose a new password</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280">If the button does not work, copy this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password" style="color:#1D552B">https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password</a></p>
    <p style="margin:0;font-size:13px;color:#6b7280">If you did not ask to reset your password, ignore this email. Your password stays the same.</p>
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center">TractorAuction.com is a search and aggregation platform. We are not the auctioneer, seller, or bidding platform.</p>
</div>
```

### 3. Change email address (optional, not used yet)

**Subject**

```
Confirm your new TractorAuction.com email address
```

**Message body**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1d1e">
  <div style="background:#1D552B;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="color:#ffffff;font-size:20px;font-weight:bold">TractorAuction.com</span>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px;font-size:20px">Confirm your new email address</h2>
    <p style="margin:0 0 20px;line-height:1.5">Confirm that you want to change your account email from {{ .Email }} to {{ .NewEmail }}.</p>
    <p style="margin:0 0 24px">
      <a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=email_change&next=/account/watchlist"
         style="display:inline-block;background:#1D552B;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px">Confirm new email</a>
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280">If you did not ask for this change, ignore this email and contact support@tractorauction.com.</p>
  </div>
</div>
```

### 4. Invite user (optional, not used yet)

**Subject**

```
You're invited to TractorAuction.com
```

**Message body**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1d1e">
  <div style="background:#1D552B;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="color:#ffffff;font-size:20px;font-weight:bold">TractorAuction.com</span>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px;font-size:20px">You're invited</h2>
    <p style="margin:0 0 20px;line-height:1.5">You have been invited to create a TractorAuction.com account. Accept the invitation, then set your password.</p>
    <p style="margin:0 0 24px">
      <a href="https://www.tractorauction.com/callback?token_hash={{ .TokenHash }}&type=invite&next=/reset-password"
         style="display:inline-block;background:#1D552B;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px">Accept invitation</a>
    </p>
  </div>
</div>
```

---

## Sender name and address

Supabase dashboard → Authentication → SMTP Settings (or Project Settings →
Auth → SMTP). Emails currently go out as `"Tractor Auction" <partnerships@tractorauction.com>`.
Suggested once the Microsoft 365 mailbox exists:

- **Sender name:** `TractorAuction.com`
- **Sender email:** `support@tractorauction.com`, so a reply reaches a real inbox
  (both addresses bounce until the domain has an MX record).

## Check it

1. Sign up with a real inbox, open the confirmation email **on a different
   device**, and tap the button: it should land on the watchlist, signed in.
2. On the login page use "Forgot password?", open the email, and tap the button:
   it should open "Choose a new password".
3. A link used twice, or older than an hour, should land on the login page with
   "Email link is invalid or has expired. Request a new link and try again."
