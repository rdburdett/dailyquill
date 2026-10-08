// Prints a Daily Quill usage report from Google Analytics 4, using the free
// Google Analytics Data API with a service account (no third-party connector).
//
// Usage:
//   node scripts/ga-report.mjs          last 28 days
//   node scripts/ga-report.mjs 7        last 7 days
//
// Needs GA_PROPERTY_ID and GA_SERVICE_ACCOUNT_JSON (the key file's contents, or
// a path to it) in the environment or a local .env. See PUBLISHING.md.
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { createSign } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const envPath = resolve(projectRoot, '.env')
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
	process.loadEnvFile(envPath)
}

const { GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_JSON, GITHUB_STEP_SUMMARY } = process.env
if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_JSON) {
	console.error('Missing GA_PROPERTY_ID or GA_SERVICE_ACCOUNT_JSON. See PUBLISHING.md.')
	process.exit(1)
}

const days = Math.max(1, Number.parseInt(process.argv[2] ?? '28', 10) || 28)
const key = JSON.parse(
	GA_SERVICE_ACCOUNT_JSON.trim().startsWith('{') ? GA_SERVICE_ACCOUNT_JSON : readFileSync(GA_SERVICE_ACCOUNT_JSON, 'utf8')
)

const base64url = (value) => Buffer.from(value).toString('base64url')

// Sign a short-lived JWT with the service account key and swap it for an access token
async function getAccessToken() {
	const now = Math.floor(Date.now() / 1000)
	const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
	const claims = base64url(JSON.stringify({
		iss: key.client_email,
		scope: 'https://www.googleapis.com/auth/analytics.readonly',
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600
	}))
	const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key, 'base64url')

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: `${header}.${claims}.${signature}`
		})
	})
	const body = await res.json()
	if (!res.ok) throw new Error(`Getting an access token failed (${res.status}): ${JSON.stringify(body)}`)
	return body.access_token
}

async function runReport(token, dimensions, metrics, extra = {}) {
	const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
			dimensions: dimensions.map((name) => ({ name })),
			metrics: metrics.map((name) => ({ name })),
			...extra
		})
	})
	const body = await res.json()
	if (!res.ok) throw new Error(body.error?.message ?? JSON.stringify(body))
	return (body.rows ?? []).map((row) => [
		...(row.dimensionValues ?? []).map((v) => v.value),
		...(row.metricValues ?? []).map((v) => v.value)
	])
}

function table(headers, rows) {
	if (!rows.length) return '_No data yet._\n'
	return [
		`| ${headers.join(' | ')} |`,
		`| ${headers.map(() => '---').join(' | ')} |`,
		...rows.map((row) => `| ${row.join(' | ')} |`)
	].join('\n') + '\n'
}

const extensionEvents = { inListFilter: { values: ['new_tab', 'next_quote', 'sources_changed'] } }

try {
	const token = await getAccessToken()
	const sections = [`# Daily Quill usage, last ${days} days\n`]

	const totals = await runReport(token, [], ['activeUsers', 'newUsers', 'eventCount'], {
		dimensionFilter: { filter: { fieldName: 'eventName', ...extensionEvents } }
	})
	sections.push('## Extension totals', table(['Active users', 'New users', 'Events'], totals))

	const byEvent = await runReport(token, ['eventName'], ['eventCount', 'totalUsers'], {
		orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }]
	})
	sections.push('## All events (store page and extension)', table(['Event', 'Count', 'Users'], byEvent))

	const daily = await runReport(token, ['date'], ['activeUsers', 'eventCount'], {
		dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'new_tab' } } },
		orderBys: [{ dimension: { dimensionName: 'date' } }]
	})
	sections.push('## New tabs per day', table(['Date', 'Users', 'New tabs'], daily))

	// Needs quote_source registered as a custom dimension in GA4; report it if so
	try {
		const bySource = await runReport(token, ['customEvent:quote_source'], ['eventCount'], {
			dimensionFilter: { filter: { fieldName: 'eventName', ...extensionEvents } },
			orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }]
		})
		sections.push('## Quotes shown by source', table(['Source', 'Count'], bySource))
	} catch {
		sections.push('## Quotes shown by source', '_Register `quote_source` as a custom dimension in GA4 to see this (see PUBLISHING.md)._\n')
	}

	const report = sections.join('\n')
	console.log(report)
	if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, report)
} catch (error) {
	console.error(error.message)
	process.exit(1)
}
