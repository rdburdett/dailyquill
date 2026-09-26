// Uploads the built extension zip to the Chrome Web Store and submits it for
// review, using the Chrome Web Store API v2.
//
// Usage:
//   node scripts/publish-chrome-store.mjs            upload + submit for publishing
//   node scripts/publish-chrome-store.mjs --upload-only   upload as a draft, don't submit
//   node scripts/publish-chrome-store.mjs --status   print the store's current status
//
// Credentials come from environment variables (or a local .env file):
//   CWS_EXTENSION_ID, CWS_PUBLISHER_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN
// See PUBLISHING.md for how to create them.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const envPath = resolve(projectRoot, '.env')
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
	process.loadEnvFile(envPath)
}

const args = new Set(process.argv.slice(2))
const statusOnly = args.has('--status')
const uploadOnly = args.has('--upload-only')

const required = ['CWS_EXTENSION_ID', 'CWS_PUBLISHER_ID', 'CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
	console.error(`Missing environment variables: ${missing.join(', ')}`)
	console.error('See PUBLISHING.md for how to create them.')
	process.exit(1)
}

const { CWS_EXTENSION_ID, CWS_PUBLISHER_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN } = process.env
const itemPath = `publishers/${CWS_PUBLISHER_ID}/items/${CWS_EXTENSION_ID}`
const apiBase = 'https://chromewebstore.googleapis.com'

async function request(url, options, label) {
	const res = await fetch(url, options)
	const text = await res.text()
	let body
	try {
		body = text ? JSON.parse(text) : {}
	} catch {
		body = { raw: text }
	}
	if (!res.ok) {
		throw new Error(`${label} failed (${res.status}): ${JSON.stringify(body, null, 2)}`)
	}
	return body
}

async function getAccessToken() {
	const body = await request('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: CWS_CLIENT_ID,
			client_secret: CWS_CLIENT_SECRET,
			refresh_token: CWS_REFRESH_TOKEN,
			grant_type: 'refresh_token'
		})
	}, 'Refreshing the access token')
	return body.access_token
}

function fetchStatus(token) {
	return request(`${apiBase}/v2/${itemPath}:fetchStatus`, {
		headers: { Authorization: `Bearer ${token}` }
	}, 'Fetching item status')
}

function findZip() {
	const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'dist/manifest.json'), 'utf8'))
	const zip = readdirSync(resolve(projectRoot, 'dist')).find((file) => file.endsWith(`-v${manifest.version}.zip`))
	if (!zip) {
		throw new Error(`No zip for version ${manifest.version} in dist/. Run "npm run build:extension" first.`)
	}
	return { version: manifest.version, zipPath: resolve(projectRoot, 'dist', zip) }
}

async function upload(token, zipPath) {
	const result = await request(`${apiBase}/upload/v2/${itemPath}:upload`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/zip' },
		body: readFileSync(zipPath)
	}, 'Uploading the package')

	let state = result.uploadState
	// Large packages are processed asynchronously; poll until the store is done with it
	for (let attempt = 0; state === 'IN_PROGRESS' && attempt < 30; attempt++) {
		await new Promise((done) => setTimeout(done, 5000))
		state = (await fetchStatus(token)).lastAsyncUploadState
	}
	if (state !== 'SUCCEEDED') {
		throw new Error(`Upload did not succeed (state: ${state}): ${JSON.stringify(result, null, 2)}`)
	}
	return result
}

async function publish(token) {
	return request(`${apiBase}/v2/${itemPath}:publish`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ publishType: 'DEFAULT_PUBLISH' })
	}, 'Submitting for publishing')
}

try {
	const token = await getAccessToken()

	if (statusOnly) {
		console.log(JSON.stringify(await fetchStatus(token), null, 2))
		process.exit(0)
	}

	const { version, zipPath } = findZip()
	console.log(`Uploading ${zipPath} (v${version})...`)
	const uploaded = await upload(token, zipPath)
	console.log(`Uploaded v${uploaded.crxVersion ?? version} to item ${CWS_EXTENSION_ID}.`)

	if (uploadOnly) {
		console.log('Upload only: the new version is saved as a draft in the developer dashboard.')
		process.exit(0)
	}

	const published = await publish(token)
	console.log(`Submitted for publishing. Store state: ${published.state ?? 'unknown'}`)
	if (published.warningInfo) {
		console.log(`Warnings: ${JSON.stringify(published.warningInfo, null, 2)}`)
	}
	console.log('Chrome reviews each update; it goes live automatically once approved.')
} catch (error) {
	console.error(error.message)
	process.exit(1)
}
