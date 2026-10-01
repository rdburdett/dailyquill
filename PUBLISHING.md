# Publishing to the Chrome Web Store

Releases are uploaded and submitted through the Chrome Web Store API, so there's no
more building and uploading by hand. Chrome still reviews every update; once it's
approved it goes live on its own.

## Ways to publish

**From GitHub (recommended).** Go to **Actions → Publish to Chrome Web Store → Run workflow**.
- `bump`: `patch` (default), `minor` or `major` bumps the version, publishes it, then
  commits `Release vX.Y.Z` and tags it. Pick `none` to publish the version already in
  `manifest.json`.
- `mode`: `publish` submits for review; `upload-only` just saves a draft in the dashboard.

The same run can be started from a terminal with
`gh workflow run publish-chrome-store.yml -f bump=patch`, or by asking Claude to run it.

**By pushing a tag.** Bump the version yourself (`npm run release:patch`), commit, then
`git tag v1.2.3 && git push origin v1.2.3`. The tag must match `manifest.json`.

**From your machine.** Put the credentials in a `.env` file (copy `.env.example`), then:
- `npm run publish:store`: build, zip, upload and submit for review
- `npm run publish:store:draft`: build, zip and upload as a draft only
- `npm run publish:store:status`: show what the store currently has

The store rejects an upload whose version isn't higher than the live one, so bump first.

## One-time setup: credentials

You need five values. Only the Chrome Web Store account owner can create them.

### 1. Extension ID and Publisher ID
1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **Extension ID**: click Daily Quill; it's the 32-letter ID in the URL and on the item page.
3. **Publisher ID**: the Publisher ID shown under your account's settings in the dashboard (Account / Publisher settings).

### 2. Enable the API
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project
   (for example `dailyquill-publish`), or pick an existing one.
2. **APIs & Services → Library**, search for **Chrome Web Store API**, click **Enable**.

### 3. OAuth consent screen
1. **APIs & Services → OAuth consent screen** (now called **Google Auth Platform**).
2. User type **External**. Fill in the app name and your email; the rest can stay empty.
3. Under **Audience / Test users**, add your own Google account (the one that owns the extension).
4. Then **Publish app** to move it from *Testing* to *In production*. Refresh tokens for
   apps left in Testing expire after 7 days; publishing avoids that. You don't need Google
   verification because you're the only user (you'll click through an "unverified app"
   warning once in the next step).

### 4. OAuth client ID and secret
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type **Web application**.
3. Under **Authorized redirect URIs**, add `https://developers.google.com/oauthplayground`.
4. Create it and copy the **Client ID** and **Client secret**.

### 5. Refresh token
1. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the gear (top right), tick **Use your own OAuth credentials**, paste the client ID and secret.
3. In the left box under "Input your own scopes", enter
   `https://www.googleapis.com/auth/chromewebstore` and click **Authorize APIs**.
4. Sign in with the account that owns the extension and allow access.
5. Click **Exchange authorization code for tokens** and copy the **Refresh token**.

### 6. Add them to GitHub
In the repo: **Settings → Secrets and variables → Actions → New repository secret**, one each:

| Secret | Value |
| --- | --- |
| `CWS_EXTENSION_ID` | Extension ID from step 1 |
| `CWS_PUBLISHER_ID` | Publisher ID from step 1 |
| `CWS_CLIENT_ID` | Client ID from step 4 |
| `CWS_CLIENT_SECRET` | Client secret from step 4 |
| `CWS_REFRESH_TOKEN` | Refresh token from step 5 |

To check the credentials without submitting anything, run
`npm run publish:store:status` locally, or run the workflow once with `mode: upload-only`.

If the workflow's final "Commit version bump and tag" step is rejected, `main` is
probably protected; allow GitHub Actions to push to it or use tags instead.

## Usage stats (Google Analytics 4)

The extension can send anonymous usage events to GA4: `new_tab` (with the quote's
source), `next_quote` and `sources_changed`. Each install gets a random ID; no quote
text, browsing history or personal details are sent, and users can turn it off in
Settings → "Share anonymous usage stats". Builds without the keys below send nothing.

1. In [Google Analytics](https://analytics.google.com/), create a property (Admin →
   Create → Property, e.g. "Daily Quill"), then a **Web** data stream. Any URL works
   for the stream, for example your Vercel preview site.
2. Open the stream and copy its **Measurement ID** (`G-XXXXXXX`).
3. On the same page, open **Measurement Protocol API secrets → Create**, and copy the secret.
4. Add both as GitHub repo secrets: `GA_MEASUREMENT_ID` and `GA_API_SECRET`
   (and as `VITE_GA_MEASUREMENT_ID` / `VITE_GA_API_SECRET` in `.env` for local builds).
5. In the Chrome Web Store dashboard, **Privacy** tab: tick **User activity**, certify the
   disclosures, and set the privacy
   policy URL to the `privacy.html` page on your Vercel site.

Events appear in GA4 under Reports → Realtime within a minute of opening a new tab.
