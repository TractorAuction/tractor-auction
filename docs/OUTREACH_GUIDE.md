# Outreach Agent: How to Use It

The outreach agent drafts partnership emails to auction companies with AI, lets
you review and edit each one, sends it from partnerships@tractorauction.com, and
tracks every company through the pipeline.

## 1. Getting in

1. Sign in at **tractorauction.com/login** with your admin account.
2. Open **tractorauction.com/admin/outreach** (or Admin → Outreach in the sidebar).

## 2. What you see

One row per company (43 prospects in 7 tiers, plus older contacts without a tier).

| Column | What it is |
|---|---|
| Tier | Priority. Tier 1 = largest platforms, Tier 7 = international (later phase). |
| Company | Name and website. |
| Contact & notes | Contact name, email, what integration to ask for, follow-up date and your notes. Edit and press **Save**. |
| Status | Where the company is in the pipeline (see below). |
| Email | The email composer. |

Filters at the top: by **status**, by **tier**, and **Follow-up due** (companies
whose follow-up date has arrived). **Export CSV** downloads the whole list.

## 3. Sending an email

1. In the company's **Email** column, click **Compose**, then pick the stage (First contact, Follow-up, and so on).
2. Click **Draft**. The AI writes an email for that company's tier, in about 5 seconds.
3. **Read it.** Edit the subject or body directly if anything is off. What is in the
   box is exactly what gets sent.
4. Click **Send**.

After a successful send, the status changes to **Contacted** by itself, the
outreach date is recorded, and a follow-up date is set 7 days out.

Safety check: if the same email address was already contacted in the last 30 days
(for example Ritchie Bros. and IronPlanet share one contact), the send is blocked
with a message explaining why.

## 4. Tracking responses

Replies arrive in the inbox set as the reply-to address (see "Before the first
send" below). When a company replies, update its row:

| Status | Use it when |
|---|---|
| Pending | Not contacted yet |
| Contacted | First email sent (set automatically) |
| Follow up | Sent a follow-up |
| Responded | They replied |
| API requested | We asked for feed/API access |
| API received | They gave us access |
| Integration pending | Feed is being connected |
| Integrated | Their listings are live on the site |
| Declined | They said no |
| No response | Gave up after follow-ups |

Use **Notes** for anything said in the reply, and set a new **follow-up date** so
the company shows up under **Follow-up due** at the right time.

When a company sends feed or API details, forward them to the developer: a new
source is connected by configuration, without a site rebuild.

## 5. Before the first send

**tractorauction.com cannot receive email yet.** The domain has no mail (MX)
records, so a reply to partnerships@tractorauction.com would bounce. Before
sending, do one of these:

- Set up a mailbox for the domain (Google Workspace, Microsoft 365, Zoho, or
  GoDaddy email, since GoDaddy hosts the DNS), or a free forwarding service such
  as ImprovMX, so partnerships@tractorauction.com forwards to your inbox.
- Or tell the developer which inbox should receive replies, and it will be set as
  the reply-to address (`OUTREACH_REPLY_TO`) on every outreach email.

## 6. Good practice

- Start with Tier 1 (about 10 emails). Send a few, read the replies, then continue.
- Always read the draft. The AI follows strict rules (no invented facts, no
  pricing promises, under 200 words), but you know the relationship best.
- Follow up once after 7 days, then mark **No response** after a second follow-up.
