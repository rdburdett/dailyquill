// Anonymous usage stats sent to Google Analytics 4 through the Measurement
// Protocol. Extensions can't load gtag.js (remote code is banned in MV3), so
// events are posted directly. Nothing is sent from the website version, when
// the GA4 keys weren't set at build time, or when the user has opted out.
import { isExtension } from './runtime'
import { storageService } from './storageService'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
const apiSecret = import.meta.env.VITE_GA_API_SECRET as string | undefined
const endpoint = 'https://www.google-analytics.com/mp/collect'

// GA4's default: a session ends after 30 minutes without activity
const sessionTimeoutMs = 30 * 60 * 1000

type EventParams = Record<string, string | number>

// A random ID per browser install. It identifies nothing about the person.
async function getClientId(): Promise<string> {
	const { analyticsClientId } = await chrome.storage.local.get('analyticsClientId')
	if (typeof analyticsClientId === 'string') return analyticsClientId
	const id = crypto.randomUUID()
	await chrome.storage.local.set({ analyticsClientId: id })
	return id
}

async function getSessionId(): Promise<string> {
	const now = Date.now()
	const { analyticsSession } = await chrome.storage.local.get('analyticsSession')
	const current = analyticsSession as { id: string; lastActive: number } | undefined
	const id = current && now - current.lastActive < sessionTimeoutMs ? current.id : String(Math.floor(now / 1000))
	await chrome.storage.local.set({ analyticsSession: { id, lastActive: now } })
	return id
}

export async function trackEvent(name: string, params: EventParams = {}): Promise<void> {
	if (!isExtension || !measurementId || !apiSecret) return
	try {
		const settings = await storageService.getSettings()
		if (settings.shareUsageStats === false) return

		const body = JSON.stringify({
			client_id: await getClientId(),
			events: [{
				name,
				params: {
					...params,
					session_id: await getSessionId(),
					// GA4 only counts a user as active when an event carries engagement time
					engagement_time_msec: 100,
					extension_version: chrome.runtime.getManifest().version
				}
			}]
		})
		// no-cors: we never read the response, and it avoids needing an extra host permission
		await fetch(`${endpoint}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
			method: 'POST',
			mode: 'no-cors',
			body
		})
	} catch {
		// Analytics must never break the new tab page
	}
}
