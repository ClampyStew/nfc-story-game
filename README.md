# 🎃 The Butcher's Maze: NFC Story Game

An interactive horror story generator for live events. Players enter their name, then tap their phone on NFC tags to pick a **character**, a **location**, and a **storyline phase**. The app turns those choices into a cinematic prompt with **Amazon Nova Lite** and renders a 6-second video with **Amazon Nova Reel**, with everything saved per player in S3.

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
| Hosting used at the event | Vercel |

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
├── scripts/                      # Command-line tools (see below)
│   ├── generateStory.mjs
│   ├── generateStoryAdvanced.mjs
│   ├── localTestHarness.mjs
│   └── processNovaLite.debug.mjs # Lambda handler (S3-triggered pipeline)
├── postcss.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Game Content

**Characters** (motive is what Nova Lite builds the scene around)

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
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

### Environment Variables

| Variable | Example | Purpose |
|---|---|---|
| `AWS_REGION` | `us-east-1` | Region for Bedrock and S3 |
| `OUTPUT_BUCKET` | `reel-output` | S3 bucket for prompts and videos |
| `AWS_ACCESS_KEY_ID` | (secret) | Only needed outside AWS-managed compute |
| `AWS_SECRET_ACCESS_KEY` | (secret) | Only needed outside AWS-managed compute |

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

## NFC Tags

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

Locations and characters were also reworded to be milder. Edit `sanitizeText()` and `containsUnsafeContent()` to tune the filtering.

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
    ├── <job-id>/output.mp4   # Nova Reel writes video here
    └── success.json          # written by the Lambda pipeline
```

### 3. IAM policy

Nova Reel is started with `StartAsyncInvokeCommand`, which is authorized by `bedrock:InvokeModel`. Polling needs `bedrock:GetAsyncInvoke`. (`bedrock:InvokeModelAsync` and `bedrock:StartAsyncInvoke` are **not** valid IAM actions.)

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

Replace `<ACCOUNT_ID>` and tighten the wildcards for production.

---

## Deployment

### Option A: Vercel (used at the event)

1. Push the repo to GitHub and import it at vercel.com.
2. Add the four environment variables (Settings → Environment Variables) for Production, Preview, and Development.
3. Deploy from the repo root:
   ```bash
   vercel deploy --prod
   ```
4. Programme the NFC tags with your production URL.

### Option B: AWS Amplify Hosting (full-AWS web app)

Amplify Hosting supports Next.js server-side rendering and API routes, and lets the app use an IAM role instead of stored access keys. Check the current Amplify docs, as console steps change.

1. **Amplify console → Create new app → Host web app**, connect your GitHub repo and branch.
2. Amplify detects Next.js. Accept the default build settings (`npm ci`, `npm run build`).
3. **Environment variables:** Amplify reserves the `AWS_` prefix, so you cannot set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, or `AWS_SECRET_ACCESS_KEY`. Rename the region variable (for example `APP_REGION`) and `OUTPUT_BUCKET`, then update `route.js`:
   ```javascript
   const REGION = process.env.APP_REGION || "us-east-1";
   ```
4. **Compute role:** create an IAM role with the policy above and attach it as the app's SSR compute role (App settings → IAM roles). The AWS SDK then picks up credentials automatically, so no keys are needed.
5. Deploy, then test `/start` → `/scan`.

> ⚠️ Amplify's server-side request timeout is short. See *Known Limitations* before relying on long video jobs inside a single request.

### Option C: S3-triggered Lambda pipeline (CLI/event-driven)

`scripts/processNovaLite.debug.mjs` is a Lambda handler: when a `novaLiteOutput.json` lands in S3, it starts Nova Reel with that prompt, polls until done, and writes `success.json`.

1. Create a Lambda (Node.js 20+, ES module) and upload the handler plus `node_modules` (or use a layer).
2. Set the timeout to **15 minutes** and memory to 512 MB or more.
3. Environment variables: `OUTPUT_BUCKET=reel-output`.
4. Attach an execution role with the IAM policy above plus CloudWatch Logs.
5. Add an **S3 trigger** on the bucket for `PUT` events with suffix filter **`novaLiteOutput.json`**. The suffix filter matters: it stops the Lambda re-triggering itself when it writes `success.json` or Nova Reel writes `output.mp4`.

> ⚠️ Don't run Option C and the web API's built-in video generation against the same bucket at the same time. The API route writes `novaLiteOutput.json`, which would fire the Lambda and generate a **second** video. Pick one: either set `generateVideo: false` in the web request and let Lambda render, or skip the trigger.

---

## Command-Line Tools

```bash
# Prompt only; saves to S3 (Lambda trigger renders the video)
node scripts/generateStory.mjs Klee "An adventurer" "looking for treasure" "island with a volcano"

# Prompt + immediate video generation with progress polling
node scripts/generateStoryAdvanced.mjs Klee "An adventurer" "looking for treasure" "island with a volcano" --generate-video

# Run the Lambda handler locally against a fake S3 event
node scripts/localTestHarness.mjs
```

Run them as `node file.mjs` (not `node --input-type=module`).

---

## Known Limitations & Next Steps

- **Long requests:** the API route polls Nova Reel for up to 15 minutes inside one HTTP request. Serverless hosts (Vercel, Amplify) cap function duration well below that. The robust pattern is: `POST /api` starts the job and returns the `invocationArn`; a `GET /api/status` endpoint checks `GetAsyncInvokeCommand`; the result page polls it.
- **Video playback:** the result page currently shows an `s3://` path, which browsers can't play. Generate a **presigned URL** (`@aws-sdk/s3-request-presigner`) for the `.mp4` and use it in a `<video>` tag. Nova Reel writes output to `s3://<bucket>/<player>/<job-id>/output.mp4`, so look the key up (list the prefix or use the job's output URI) rather than assuming `output.mp4` at the root.
- **Player name on tag scans:** tag URLs don't contain the player's name, and `/scan` redirects to `/start` when `?name=` is missing. Fix by falling back to `localStorage.storyData.playerName` in `scan/page.js`, so a scan from the NFC tag keeps the player's session.
- **Duplicate player names** overwrite each other's S3 folder. Add a short random suffix or timestamp to the S3 prefix.
- **Cost:** Nova Reel is billed per second of generated video. Check the Amazon Bedrock pricing page before running at scale.
- **Secrets:** use IAM roles where possible; never commit access keys.

## Troubleshooting Notes (issues hit during development)

| Symptom | Cause / Fix |
|---|---|
| `ERR_INPUT_TYPE_NOT_ALLOWED` | Don't pass `--input-type=module` with a file; use `node file.mjs` |
| `modelInput must not be null` / `S3OutputDataConfig cannot be null` | Use `modelInput` (object) and `outputDataConfig.s3OutputDataConfig.s3Uri` |
| `required key [taskType] not found` | Nova Reel payload needs `taskType: "TEXT_VIDEO"` and `textToVideoParams` |
| `not authorized: bedrock:GetAsyncInvoke` | Add `bedrock:GetAsyncInvoke` (and `InvokeModel`) to the IAM user/role |
| Nova Lite `extraneous key [max_tokens]` | Nova uses `inferenceConfig.max_new_tokens`, `content: [{text}]`, `system: [{text}]` |
| `PermanentRedirect` / `ENOTFOUND` on S3 | Bucket region ≠ client region |
| Next.js "conflicting app and page file" | Delete old `pages/index.js` |
| "page.js doesn't have a root layout" | Add `app/layout.js` |
| API 404 in App Router | Route handlers must be named `route.js` and export `POST` |
| No Tailwind colours | Tailwind v4 needs `@tailwindcss/postcss` and `@import "tailwindcss"` |
| `Module not found: lucide-react` | `npm install lucide-react` (only if a component imports it) |

---

## Adding This to the GitHub Repo

### Files to add or update

| Path | Action |
|---|---|
| `README.md` | Add (this file) |
| `app/layout.js`, `app/globals.css`, `app/page.js` | Add/update |
| `app/start/page.js`, `app/scan/page.js`, `app/result/page.js` | Add/update (new NFC flow) |
| `app/api/route.js` | Update (content filtering, `fullPrompt` support) |
| `public/images/**` | Add character, location, and storyline pictures |
| `scripts/` | Move CLI tools and Lambda handler here |
| `postcss.config.js`, `package.json` | Update for Tailwind v4 |
| `.env.example` | Add (template below, **no real values**) |
| `.gitignore` | Add/update (below) |

### Files to remove

The old multi-page flow is replaced by `/scan`:

```bash
git rm -r app/character app/setting app/action app/review
```

### `.env.example`

```
AWS_REGION=us-east-1
OUTPUT_BUCKET=reel-output
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### `.gitignore`

```
node_modules
.next
.vercel
.env
.env.local
*.log
```

### Commit and push

```bash
mkdir -p scripts
git mv generateStory.mjs generateStoryAdvanced.mjs localTestHarness.mjs processNovaLite.debug.mjs scripts/ 2>/dev/null
git add .
git status          # confirm no .env or secrets are staged
git commit -m "NFC story flow, Nova Lite/Reel pipeline, README and AWS deploy docs"
git push origin main
```

If an old `processNovaLite2.js` is still in the repo, remove it: it uses the outdated `InvokeModelAsyncCommand` and won't work.

---

## License

Add a license of your choice (for example MIT) as `LICENSE`.
