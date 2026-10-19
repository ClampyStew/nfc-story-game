# 🎃 The Butcher's Maze: NFC Story Game

An interactive horror story generator built for a live event. Players enter their name, then tap their phone on NFC tags to pick a **character**, a **location**, and a **storyline phase**. The app turns those choices into a cinematic prompt with **Amazon Nova Lite** and renders a 6-second video with **Amazon Nova Reel**, with everything saved per player in S3.

---

## ⚠️ Disclaimer: Unmaintained Project

**This repository is no longer maintained.** It was built for a one-off event and is provided as-is, with no support, updates, or security fixes. Issues and pull requests may not be answered.

### Security: patch React2Shell before using this

This project uses the **Next.js App Router**, which is affected by **React2Shell (CVE-2025-55182)**, a critical (CVSS 10.0) unauthenticated remote code execution vulnerability in React Server Components. It was reported as under active exploitation shortly after disclosure.

If you want to use or deploy this code, you **must** upgrade before doing anything else.

| Package | Patched versions |
|---|---|
| `react`, `react-dom` (React 19) | 19.0.1, 19.1.2, 19.2.1 or later |
| `next` | 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7 or later |

```bash
npm list next react react-dom        # check what you have
npm install next@latest react@latest react-dom@latest
```

Notes:
- Don't stop at the minimum patched version. Follow-up advisories were issued for related React Server Components flaws (denial of service and source-code exposure), so move to the latest patched release and read the official [React](https://react.dev/blog) and [Next.js](https://nextjs.org/blog) security advisories.
- If any deployment of this app ran on an unpatched version, treat its environment variables (including the AWS access keys) as potentially exposed and **rotate them**.
- Dependencies in this repo are otherwise unaudited. Run `npm audit` and review before use.

---

## How It Works

```
Visit site (/) → /start (enter name)
        ↓
/scan  ← player taps NFC tags (URL: /scan?nfc=<id>)
        ↓  each tag shows picture, name and backstory
   "Use this" → saved to the player   |   "Reject" → back to scanning
        ↓  (all 3 chosen → "Submit & Generate!")
POST /api  →  Nova Lite (prompt)  →  Nova Reel (video)  →  S3 (<player>/...)
        ↓
/result (prompt + story summary + video info)
```

Choices are kept in the browser's `localStorage` while the player scans, and the generated prompt and video are stored in S3 under the player's name.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS v4 |
| API | Next.js route handler (`app/api/route.js`) |
| Text generation | Amazon Bedrock, Nova Lite (`us.amazon.nova-lite-v1:0`) |
| Video generation | Amazon Bedrock, Nova Reel (`amazon.nova-reel-v1:0`, async invoke) |
| Storage | Amazon S3 (`reel-output` bucket) |
| Hosting | Vercel |

## Repository Structure

```
nfc-story-game/
├── app/
│   ├── layout.js                 # Root layout (imports globals.css)
│   ├── globals.css               # Tailwind v4 import + custom animations
│   ├── page.js                   # Redirects "/" to "/start"
│   ├── start/page.js             # Name entry
│   ├── scan/page.js              # NFC scanning, Use/Reject, Submit
│   ├── result/page.js            # Prompt + story summary + video info
│   └── api/
│       └── route.js              # POST /api: Nova Lite → Nova Reel → S3
├── public/
│   └── images/
│       ├── characters/           # naomi.jpg, eddie.jpg, clara.jpg, jayden.jpg, miles.jpg
│       ├── locations/            # pumpkin-farm.jpg, library.jpg, carnival.jpg,
│       │                         # cemetery.jpg, hospital.jpg, parade.jpg
│       └── storylines/           # lure.jpg, escalation.jpg, trap.jpg, descent.jpg
├── generateStory.mjs             # Optional CLI: prompt only
├── generateStoryAdvanced.mjs     # Optional CLI: prompt + video
├── postcss.config.js
├── package.json
└── README.md
```

## Game Content

**Characters** (the motive is what Nova Lite builds the scene around)
(byo your images)
| ID | Name | Motive |
|---|---|---|
| `naomi` | Naomi | Disproving danger, staying safe |
| `eddie` | Eddie | Dares, ego, and thrill-seeking |
| `clara` | Clara | Rationalizing and debunking myths |
| `jayden` | Jayden | Filming and "viral" proof |
| `miles` | Miles | Compassion for ghosts, supernatural curiosity |

**Locations:** `pumpkin-farm`, `library`, `carnival`, `cemetery`, `hospital`, `parade`

**Storyline phases:** `lure` → `escalation` → `trap` → `descent`. Every storyline leads toward the Butcher's Maze.

---

## Local Setup

**Requirements:** Node.js 20+, an AWS account with Bedrock model access, and an S3 bucket.

```bash
git clone <your-repo-url>
cd nfc-story-game
npm install
# Patch React/Next.js first (see the disclaimer above)
```

Create `.env.local` with:

| Variable | Example | Purpose |
|---|---|---|
| `AWS_REGION` | `us-east-1` | Region for Bedrock and S3 |
| `OUTPUT_BUCKET` | `reel-output` | S3 bucket for prompts and videos |
| `AWS_ACCESS_KEY_ID` | (secret) | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | (secret) | IAM user secret |

```bash
npm run dev      # http://localhost:3000
```

Never commit `.env.local` or any credentials.

### Tailwind v4 Notes

This project uses Tailwind CSS **v4**, which differs from v3:

```bash
npm install -D tailwindcss @tailwindcss/postcss
```

`postcss.config.js`
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`app/globals.css` must start with `@import "tailwindcss";` (not the old `@tailwind base/components/utilities` lines). A `tailwind.config.js` is not required in v4.

---

## NFC Tags (BYO)

Write each tag as a **URL record** pointing at the scan page (any NFC writer app works, such as NFC Tools or NXP TagWriter):

```
https://<your-domain>/scan?nfc=<id>
```

| Type | Tag URLs |
|---|---|
| Characters | `?nfc=naomi`, `?nfc=eddie`, `?nfc=clara`, `?nfc=jayden`, `?nfc=miles` |
| Locations | `?nfc=pumpkin-farm`, `?nfc=library`, `?nfc=carnival`, `?nfc=cemetery`, `?nfc=hospital`, `?nfc=parade` |
| Storylines | `?nfc=lure`, `?nfc=escalation`, `?nfc=trap`, `?nfc=descent` |
| Debug toggle | `?nfc=debug` |

### Debug Mode

Scanning the `debug` tag (or opening `/scan?name=Test&nfc=debug`) toggles a panel of test buttons that simulate scanning any tag, so you can test the full flow without physical tags. It is off by default, is not remembered between sessions, and can be switched off with the Disable button.

---

## Content Moderation

Nova Reel rejects prompts containing violent or graphic language, so `app/api/route.js` filters content in layers:

1. **Input sanitizing:** a word-replacement map swaps trigger words (e.g. "cleaver", "blood", "butcher") for atmospheric alternatives.
2. **Constrained system prompt:** Nova Lite is told to describe mood, lighting, fog, and camera movement only.
3. **Output check:** the generated text is sanitized again and scanned for banned words.
4. **Fallback prompt:** if anything unsafe survives, a pre-written atmospheric prompt is used so generation never fails on a moderation block.

Edit `sanitizeText()` and `containsUnsafeContent()` to tune the filtering.

---

## AWS Setup

### 1. Enable model access

In the Bedrock console (region `us-east-1`), open **Model access** and request **Amazon Nova Lite** and **Amazon Nova Reel**.

### 2. Create the S3 bucket

Create `reel-output` (or your own name) in the **same region** as `AWS_REGION`. A mismatched region produces `PermanentRedirect` errors.

Output layout:
```
s3://reel-output/<playerName>/
    ├── novaLiteOutput.json   # prompt + choices
    └── <job-id>/output.mp4   # Nova Reel writes the video here
```

### 3. IAM user and policy

Create a dedicated IAM user for the app with only this policy. Nova Reel is started with `StartAsyncInvokeCommand`, which is authorized by `bedrock:InvokeModel`. Polling needs `bedrock:GetAsyncInvoke`. (`bedrock:InvokeModelAsync` and `bedrock:StartAsyncInvoke` are **not** valid IAM actions.)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvoke",
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:GetAsyncInvoke", "bedrock:ListAsyncInvokes"],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:<ACCOUNT_ID>:inference-profile/*",
        "arn:aws:bedrock:*:<ACCOUNT_ID>:async-invoke/*"
      ]
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::reel-output/*"
    },
    {
      "Sid": "S3List",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::reel-output"
    }
  ]
}
```

Replace `<ACCOUNT_ID>` and tighten the wildcards where you can.

---

## Deploying to Vercel

1. **Patch first.** Upgrade `next`, `react`, and `react-dom` to patched versions (see the disclaimer) and confirm `npm run build` succeeds locally.
2. Push the repo to GitHub and import it at [vercel.com](https://vercel.com).
3. Add the four environment variables (Settings → Environment Variables) for Production, Preview, and Development: `AWS_REGION`, `OUTPUT_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
4. Deploy from the repo root:
   ```bash
   vercel deploy --prod
   ```
5. Visit `/start` to test, then programme the NFC tags with your production URL.

Vercel project facts to remember:
- Deploy from the **project root** (where `package.json` is), not from `app/`.
- Environment variable changes only apply to **new** deployments, so redeploy after editing them.
- View logs in the Vercel dashboard (Deployments → a deployment → Logs).

---

## Optional Command-Line Tools

```bash
# Prompt only; saves to S3
node generateStory.mjs Klee "An adventurer" "looking for treasure" "island with a volcano"

# Prompt + immediate video generation with progress polling
node generateStoryAdvanced.mjs Klee "An adventurer" "looking for treasure" "island with a volcano" --generate-video
```

These need the same AWS credentials in your shell environment.

---

## Known Limitations

- **Long requests:** the API route polls Nova Reel for up to 15 minutes inside one HTTP request, which is longer than Vercel's function duration limit on most plans. A robust version would have `POST /api` start the job and return the `invocationArn`, add a status endpoint that calls `GetAsyncInvokeCommand`, and have the result page poll it.
- **Video playback:** the result page shows an `s3://` path, which browsers can't play. Generate a presigned URL (`@aws-sdk/s3-request-presigner`) for the `.mp4`. Nova Reel writes to `s3://<bucket>/<player>/<job-id>/output.mp4`, so look up the real key rather than assuming `output.mp4` at the root.
- **Player name on tag scans:** tag URLs don't contain the player's name, and `/scan` redirects to `/start` when `?name=` is missing. Fix by falling back to the name stored in `localStorage` in `scan/page.js`.
- **Duplicate player names** overwrite each other's S3 folder. Add a suffix or timestamp to the S3 prefix.
- **Cost:** Nova Reel is billed per second of generated video. Check the Amazon Bedrock pricing page before running at scale.

## Troubleshooting Notes

| Symptom | Cause / Fix |
|---|---|
| `modelInput must not be null` / `S3OutputDataConfig cannot be null` | Use `modelInput` (object) and `outputDataConfig.s3OutputDataConfig.s3Uri` |
| `required key [taskType] not found` | Nova Reel payload needs `taskType: "TEXT_VIDEO"` and `textToVideoParams` |
| `not authorized: bedrock:GetAsyncInvoke` | Add `bedrock:GetAsyncInvoke` (and `InvokeModel`) to the IAM user |
| Nova Lite `extraneous key [max_tokens]` | Nova uses `inferenceConfig.max_new_tokens`, `content: [{text}]`, `system: [{text}]` |
| `PermanentRedirect` / `ENOTFOUND` on S3 | Bucket region ≠ client region |
| Next.js "conflicting app and page file" | Delete old `pages/index.js` |
| "page.js doesn't have a root layout" | Add `app/layout.js` |
| API 404 in App Router | Route handlers must be named `route.js` and export `POST` |
| No Tailwind colours | Tailwind v4 needs `@tailwindcss/postcss` and `@import "tailwindcss"` |

---

## License

Codebase provided under the MIT License. See LICENSE for more info.
