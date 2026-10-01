// Storage service for Chrome extension settings and cache
import type { QuoteSourceId } from './sources'
import { isExtension } from './runtime'

export interface ExtensionSettings {
	enabledSources?: QuoteSourceId[]
	showSource: boolean
	favoriteQuotes: string[]
	lastFetchTime: number
	selectedTheme: string
	themeMode?: 'system' | 'light' | 'dark'
	selectedQuoteFont?: string
	selectedUIFont?: string
	// Theme-specific font preferences
	selectedLightFont?: string
	selectedDarkFont?: string
	// Font behavior preference
	fontFollowsTheme?: boolean
	selectedDaisyTheme?: string
	selectedLightTheme?: string
	selectedDarkTheme?: string
	selectedSemanticTheme?: string
	backgroundLightnessLight?: number
	backgroundLightnessDark?: number
	fontSize?: number
	// Anonymous usage stats (see analytics.ts); on unless the user turns it off
	shareUsageStats?: boolean
	cachedQuote?: {
		text: string
		author: string
		source: string
		timestamp: number
	}
	prefetchedQuote?: {
		text: string
		author: string
		source: string
		timestamp: number
	}
}

// Mock Chrome storage for the website version (dev server / preview)
const mockChromeStorage = {
	sync: {
		get: async (key: string | string[]) => {
			const keys = Array.isArray(key) ? key : [key];
			const out: Record<string, any> = {};
			for (const k of keys) {
				const stored = localStorage.getItem(`chrome.storage.sync.${k}`);
				out[k] = stored ? JSON.parse(stored) : undefined;
			}
			return out;
		},
		set: async (data: any) => {
			Object.entries(data).forEach(([key, value]) => {
				localStorage.setItem(`chrome.storage.sync.${key}`, JSON.stringify(value));
			});
		}
	}
};

// Use real Chrome storage in the extension, localStorage everywhere else
const storage = isExtension ? chrome.storage : mockChromeStorage;

class StorageService {
	private defaultSettings: ExtensionSettings = {
		enabledSources: ['zenquotes'],
		showSource: true,
		favoriteQuotes: [],
		lastFetchTime: 0,
		selectedTheme: 'default',
		themeMode: 'system',
		selectedLightFont: 'elegant', // Playfair Display for light mode
		selectedDarkFont: 'monospace', // Ubuntu Mono for dark mode
		fontFollowsTheme: true, // Default to automatic font switching
		selectedQuoteFont: 'elegant', // Fallback for single font mode
		shareUsageStats: true
	}

	async getSettings(): Promise<ExtensionSettings> {
		try {
			const result = await storage.sync.get('settings')
			return { ...this.defaultSettings, ...result.settings }
		} catch (error) {
			console.warn('Storage service error:', error);
			return this.defaultSettings;
		}
	}

	async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
		try {
			const currentSettings = await this.getSettings()
			const newSettings = { ...currentSettings, ...settings }
			await storage.sync.set({ settings: newSettings })
		} catch (error) {
			console.warn('Storage service error:', error);
		}
	}

	async cacheQuote(quote: { text: string; author: string; source: string }): Promise<void> {
		try {
			// Don't cache error messages
			if (this.isErrorQuote(quote)) {
				console.warn('Refusing to cache error quote:', quote.text.substring(0, 50));
				return;
			}
			const cachedQuote = {
				...quote,
				timestamp: Date.now()
			}
			await this.saveSettings({ cachedQuote, lastFetchTime: Date.now() })
		} catch (error) {
			console.warn('Cache quote error:', error);
		}
	}

	private isErrorQuote(quote: { text: string; author: string }): boolean {
		// ZenQuotes returns error messages as "quotes" - detect and reject them
		const errorPatterns = [
			/too many requests/i,
			/rate limit/i,
			/auth key/i,
			/unlimited access/i
		]
		return errorPatterns.some(pattern => 
			pattern.test(quote.text) || pattern.test(quote.author)
		)
	}

	async getCachedQuote(): Promise<{ text: string; author: string; source: string } | null> {
		try {
			const settings = await this.getSettings()
			const cached = settings.cachedQuote
			
			if (!cached) return null
			
			// Reject error messages that were accidentally cached
			if (this.isErrorQuote(cached)) {
				// Clear the bad cache entry
				await this.saveSettings({ cachedQuote: undefined })
				return null
			}
			
			// Cache is valid for 24 hours (daily quotes)
			const isValid = Date.now() - cached.timestamp < 24 * 60 * 60 * 1000
			return isValid ? cached : null
		} catch (error) {
			console.warn('Get cached quote error:', error);
			return null;
		}
	}

	async shouldFetchNewQuote(): Promise<boolean> {
		try {
			const settings = await this.getSettings()
			const timeSinceLastFetch = Date.now() - settings.lastFetchTime
			
			// Fetch new quote if more than 10 minutes have passed
			return timeSinceLastFetch > 10 * 60 * 1000
		} catch (error) {
			console.warn('Should fetch new quote error:', error);
			return true; // Default to fetching new quote on error
		}
	}

	async getSelectedTheme(): Promise<string> {
		try {
			const settings = await this.getSettings()
			return settings.selectedTheme
		} catch (error) {
			console.warn('Get selected theme error:', error);
			return 'default';
		}
	}

	async saveSelectedTheme(theme: string): Promise<void> {
		try {
			await this.saveSettings({ selectedTheme: theme })
		} catch (error) {
			console.warn('Save selected theme error:', error);
		}
	}

	async getSelectedQuoteFont(): Promise<string> {
		try {
			const settings = await this.getSettings()
			return settings.selectedQuoteFont || 'classic'
		} catch (error) {
			console.warn('Get selected quote font error:', error);
			return 'classic';
		}
	}

	async saveSelectedQuoteFont(font: string): Promise<void> {
		try {
			await this.saveSettings({ selectedQuoteFont: font })
		} catch (error) {
			console.warn('Save selected quote font error:', error);
		}
	}

	async getSelectedUIFont(): Promise<string> {
		try {
			const settings = await this.getSettings()
			return settings.selectedUIFont || 'readable'
		} catch (error) {
			console.warn('Get selected UI font error:', error);
			return 'readable';
		}
	}

	async saveSelectedUIFont(font: string): Promise<void> {
		try {
			await this.saveSettings({ selectedUIFont: font })
		} catch (error) {
			console.warn('Save selected UI font error:', error);
		}
	}

	async cachePrefetchedQuote(quote: { text: string; author: string; source: string }): Promise<void> {
		try {
			// Don't cache error messages
			if (this.isErrorQuote(quote)) {
				console.warn('Refusing to cache error quote for prefetch:', quote.text.substring(0, 50));
				return;
			}
			const prefetchedQuote = {
				...quote,
				timestamp: Date.now()
			}
			await this.saveSettings({ prefetchedQuote })
		} catch (error) {
			console.warn('Cache prefetched quote error:', error);
		}
	}

	async getPrefetchedQuote(): Promise<{ text: string; author: string; source: string } | null> {
		try {
			const settings = await this.getSettings()
			const prefetched = settings.prefetchedQuote
			
			if (!prefetched) return null
			
			// Reject error messages that were accidentally cached
			if (this.isErrorQuote(prefetched)) {
				// Clear the bad prefetch entry
				await this.saveSettings({ prefetchedQuote: undefined })
				return null
			}
			
			// Prefetched quotes are valid for 1 hour
			const isValid = Date.now() - prefetched.timestamp < 60 * 60 * 1000
			return isValid ? prefetched : null
		} catch (error) {
			console.warn('Get prefetched quote error:', error);
			return null;
		}
	}

	// Drop the current and prefetched quotes, e.g. after the enabled sources change
	async clearQuoteCache(): Promise<void> {
		try {
			await this.saveSettings({ cachedQuote: undefined, prefetchedQuote: undefined, lastFetchTime: 0 })
		} catch (error) {
			console.warn('Clear quote cache error:', error);
		}
	}

	async consumePrefetchedQuote(): Promise<{ text: string; author: string; source: string } | null> {
		try {
			const prefetched = await this.getPrefetchedQuote()
			if (prefetched) {
				// Move prefetched quote to current cache
				await this.cacheQuote(prefetched)
				// Clear prefetched quote
				await this.saveSettings({ prefetchedQuote: undefined })
			}
			return prefetched
		} catch (error) {
			console.warn('Consume prefetched quote error:', error);
			return null;
		}
	}
}

export const storageService = new StorageService()
