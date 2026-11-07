# Paramount Web Design — Site + Hosting Guide

This folder contains the complete Paramount Web Design website, ready to deploy on
**Netlify** with **Resend** powering the booking form and chatbot submissions.

## What's in this folder

```
paramount-web-design/
├── index.html              ← the entire website (single file)
├── netlify.toml            ← Netlify config (static site + function routing)
├── netlify/
│   └── functions/
│       └── book.js         ← serverless function: receives submissions, emails them via Resend
└── README.md               ← this guide
```

## How it works

```
Visitor submits form or chatbot booking
        │
        ▼
POST /api/book  (Netlify redirects this to the book.js function)
        │
        ▼
book.js calls the Resend API  ←  RESEND_API_KEY lives only in Netlify's
        │                         environment variables (never in the HTML)
        ▼
Email lands in your inbox (reply-to is set to the visitor's address)
```

If the endpoint is ever unavailable (for example, viewing the file without Netlify),
the site automatically falls back to opening a pre-filled email to
paramountwebdesign@outlook.com — so submissions never silently disappear.

---

## Step 1 — Upload to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new repository,
   e.g. `paramount-web-design` (public or private both work with Netlify).
2. On the repo page, click **uploading an existing file** and drag in the contents
   of this folder — `index.html`, `netlify.toml`, the `netlify/` folder, and this
   `README.md`.
3. Click **Commit changes**.

## Step 2 — Import into Netlify

1. Log in to [app.netlify.com](https://app.netlify.com) and click
   **Add new site → Import an existing project**.
2. Choose **GitHub** and authorize Netlify, then select your `paramount-web-design` repo.
3. Netlify reads `netlify.toml`, so the build settings can stay at their defaults:
   - **Build command:** (leave empty)
   - **Publish directory:** `.`
4. Click **Deploy**. Your site is live on a `*.netlify.app` URL within a minute or two.
   (Free plan: 300 credits/month — plenty for a small business site.)

## Step 3 — Set up Resend

1. Create a free account at [resend.com](https://resend.com)
   (free tier: 3,000 emails/month, 100/day).
2. **Recommended:** add and verify your domain — in Resend go to
   **Domains → Add Domain** → enter `paramountwebdesign.com` → add the DNS records
   Resend shows you (SPF + DKIM) at your domain registrar / DNS host. This lets you
   send from `bookings@paramountwebdesign.com`.
   - No domain DNS access yet? You can skip this for testing and use Resend's
     default sender `onboarding@resend.dev` — but it only delivers to the email
     address on your Resend account.
3. Go to **API Keys → Create API Key**, name it (e.g. `paramount-website`),
   give it **Full access** or sending permission, and copy the key
   (it starts with `re_`).

## Step 4 — Connect the API key in Netlify

1. In Netlify: **Site configuration → Environment variables → Add a variable**, and add:

   | Key              | Value                                                              |
   |------------------|--------------------------------------------------------------------|
   | `RESEND_API_KEY` | `re_...` (your Resend key)                                        |
   | `CONTACT_EMAIL`  | `paramountwebdesign@outlook.com` (or your new @paramountwebdesign.com address) |
   | `FROM_EMAIL`     | `Paramount Web Design <bookings@paramountwebdesign.com>` (must match a Resend-verified domain) |

2. Go to **Deploys → Trigger deploy → Clear cache and deploy site** so the function
   picks up the new variables.
3. Test it: open your live Netlify URL, fill in the booking form, submit — you
   should get an email within a minute. Submitting a booking through the chatbot
   ("Book a free consult" → follow the steps → "Send booking request ✉") tests the
   same endpoint.

## Step 5 (optional) — Custom domain

1. In Netlify: **Site configuration → Domain management → Add a domain** →
   `paramountwebdesign.com` (and `www.`).
2. Follow the DNS instructions Netlify shows (point the domain's nameservers or
   A/CNAME records at Netlify). HTTPS certificates are issued automatically.
3. Tip: if you also want `hello@paramountwebdesign.com` email addresses,
   [Cloudflare Email Routing](https://www.cloudflare.com/products/email-routing/)
   forwards them to your Outlook inbox for free (your domain's DNS needs to be on
   Cloudflare for this).

---

## Making changes later

Edit `index.html` (or the function), push the changes to GitHub, and Netlify
redeploys automatically. All pricing, services, FAQ answers, and chatbot replies
live in that one file — search it for the text you want to change.

## Security notes

- Your Resend API key is **never** in the website's HTML — it exists only in
  Netlify's environment variables and is used server-side by `book.js`.
- The form includes a hidden honeypot field that silently discards spam-bot
  submissions.
- The function validates and length-limits every field before sending.

## Costs at a glance

| Service  | Free tier                                        | Paid when needed      |
|----------|--------------------------------------------------|-----------------------|
| GitHub   | Unlimited public/private repos                   | —                     |
| Netlify  | 300 credits/month (hosting + functions)          | Personal $9/mo        |
| Resend   | 3,000 emails/month, 100/day                      | Pro $20/mo            |

For a small business site at typical lead volume, all three stay free.
