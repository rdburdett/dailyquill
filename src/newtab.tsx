import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { quoteService, type Quote } from "./quoteService";
import { storageService } from "./storageService";
import { quoteFonts, uiFonts, defaultFonts } from "./colors";
import { SettingsPanel } from "./SettingsPanel";
import { trackEvent } from "./analytics";
import { sanitizeSources, type QuoteSourceId } from "./sources";
import SwipeQuote from "./components/SwipeQuote";
import PlainQuote from "./components/PlainQuote";
import "./newtab.css";

// Font size scales for quotes (in rem values)
const fontSizeSteps = [
	{
		name: "Extra Small",
		regular: { base: "1.25rem", md: "1.5rem", lg: "1.875rem" },
		monospace: { base: "1rem", md: "1.25rem", lg: "1.5rem" },
	},
	{
		name: "Small",
		regular: { base: "1.5rem", md: "1.875rem", lg: "2.25rem" },
		monospace: { base: "1.25rem", md: "1.5rem", lg: "1.875rem" },
	},
	{
		name: "Medium Small",
		regular: { base: "1.875rem", md: "2.25rem", lg: "3rem" },
		monospace: { base: "1.5rem", md: "1.875rem", lg: "2.25rem" },
	},
	{
		name: "Medium",
		regular: { base: "2.25rem", md: "3rem", lg: "3.75rem" },
		monospace: { base: "1.875rem", md: "2.25rem", lg: "3rem" },
	},
	{
		name: "Medium Large",
		regular: { base: "3rem", md: "3.75rem", lg: "4.5rem" },
		monospace: { base: "2.25rem", md: "3rem", lg: "3.75rem" },
	},
	{
		name: "Large",
		regular: { base: "3.25rem", md: "4rem", lg: "4.75rem" },
		monospace: { base: "2.5rem", md: "3.25rem", lg: "4rem" },
	},
	{
		name: "Extra Large",
		regular: { base: "3.75rem", md: "4.5rem", lg: "5.25rem" },
		monospace: { base: "3rem", md: "3.75rem", lg: "4.5rem" },
	},
];

type ThemeMode = "system" | "light" | "dark";

// Development mode detection
const isDev = import.meta.env.DEV || window.location.hostname === "localhost";

const isPlainQuote = true;

function NewTabApp() {
	const [quote, setQuote] = useState<Quote | null>(null);
	const [loading, setLoading] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const trackedOpenRef = useRef(false);
	const [shareUsageStats, setShareUsageStats] = useState(true);
	const [backgroundLightnessLight, setBackgroundLightnessLight] =
		useState(50);
	const [backgroundLightnessDark, setBackgroundLightnessDark] = useState(50);
	const [fontSize, setFontSize] = useState(3); // Default to medium (index 3)
	const [selectedThemeMode, setSelectedThemeMode] =
		useState<ThemeMode>("system");
	const [selectedQuoteFont, setSelectedQuoteFont] = useState(
		defaultFonts.quote
	);
	const [selectedUIFont, setSelectedUIFont] = useState(defaultFonts.ui);
	// Theme-specific font preferences
	const [selectedLightFont, setSelectedLightFont] = useState("elegant"); // Playfair Display
	const [selectedDarkFont, setSelectedDarkFont] = useState("monospace"); // Ubuntu Mono
	// Font behavior preference
	const [fontFollowsTheme, setFontFollowsTheme] = useState(true);
	const [selectedLightTheme, setSelectedLightTheme] = useState("light");
	const [selectedDarkTheme, setSelectedDarkTheme] = useState("dark");
	const [selectedSemanticTheme, setSelectedSemanticTheme] =
		useState("primary");
	const [quoteVisible, setQuoteVisible] = useState(true);
	const [enabledSources, setEnabledSources] = useState<QuoteSourceId[]>(
		sanitizeSources(undefined)
	);

	// Listen for dqEnabled state from background
	useEffect(() => {
		let mounted = true;

		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.get(["dqEnabled"], (result) => {
				if (!mounted) return;
				setQuoteVisible(result.dqEnabled !== false); // default to true
			});

			const listener = (
				changes: Record<string, chrome.storage.StorageChange>
			) => {
				if (!mounted) return;
				if (changes.dqEnabled) {
					setQuoteVisible(changes.dqEnabled.newValue !== false);
				}
			};

			chrome.storage.onChanged.addListener(listener);
			return () => {
				mounted = false;
				chrome.storage.onChanged.removeListener(listener);
			};
		}

		return () => {
			mounted = false;
		};
	}, []);

	// Load saved settings on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const saved = await storageService.getSettings();
				if (saved) {
					if (saved.themeMode) {
						setSelectedThemeMode(saved.themeMode);
					}
					if (saved.selectedQuoteFont) {
						setSelectedQuoteFont(saved.selectedQuoteFont);
					}
					if (saved.selectedUIFont) {
						setSelectedUIFont(saved.selectedUIFont);
					}
					// Load theme-specific font preferences
					if (saved.selectedLightFont) {
						setSelectedLightFont(saved.selectedLightFont);
					}
					if (saved.selectedDarkFont) {
						setSelectedDarkFont(saved.selectedDarkFont);
					}
					// Load font behavior preference
					if (saved.fontFollowsTheme !== undefined) {
						setFontFollowsTheme(saved.fontFollowsTheme);
					}
					if (saved.backgroundLightnessLight !== undefined) {
						setBackgroundLightnessLight(
							saved.backgroundLightnessLight
						);
					}
					if (saved.backgroundLightnessDark !== undefined) {
						setBackgroundLightnessDark(
							saved.backgroundLightnessDark
						);
					}
					if (saved.fontSize !== undefined) {
						setFontSize(saved.fontSize);
					}
					setEnabledSources(sanitizeSources(saved.enabledSources));
					setShareUsageStats(saved.shareUsageStats !== false);
				}
			} catch (error) {
				// Silently handle loading errors
			}
		};
		loadSettings();
	}, []);

	// Load Google Fonts
	useEffect(() => {
		// Remove dynamic font loading - fonts will be loaded via CSS imports instead
	}, [selectedQuoteFont, selectedUIFont]);

	// Save font preferences when they change
	useEffect(() => {
		storageService.saveSelectedQuoteFont(selectedQuoteFont);
	}, [selectedQuoteFont]);

	useEffect(() => {
		storageService.saveSelectedUIFont(selectedUIFont);
	}, [selectedUIFont]);

	// Save theme-specific font preferences when they change
	useEffect(() => {
		storageService.saveSettings({ selectedLightFont });
	}, [selectedLightFont]);

	useEffect(() => {
		storageService.saveSettings({ selectedDarkFont });
	}, [selectedDarkFont]);

	// Save font behavior preference when it changes
	useEffect(() => {
		storageService.saveSettings({ fontFollowsTheme });
	}, [fontFollowsTheme]);

	// Save background lightness when it changes
	useEffect(() => {
		storageService.saveSettings({ backgroundLightnessLight });
	}, [backgroundLightnessLight]);

	useEffect(() => {
		storageService.saveSettings({ backgroundLightnessDark });
	}, [backgroundLightnessDark]);

	// Save font size when it changes
	useEffect(() => {
		storageService.saveSettings({ fontSize });
	}, [fontSize]);

	// Helper to determine if dark mode is active
	const isDark =
		selectedThemeMode === "dark" ||
		(selectedThemeMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	// Apply fonts to CSS variables - handle both automatic and single font modes
	useEffect(() => {
		// Determine which font to use based on fontFollowsTheme preference
		const currentQuoteFont = fontFollowsTheme 
			? (isDark ? selectedDarkFont : selectedLightFont)
			: selectedQuoteFont;
		
		const quoteFont =
			quoteFonts[currentQuoteFont as keyof typeof quoteFonts];
		const uiFont = uiFonts[selectedUIFont as keyof typeof uiFonts];

		if (quoteFont) {
			document.documentElement.style.setProperty(
				"--quote-font",
				quoteFont.family
			);
		}
		if (uiFont) {
			document.documentElement.style.setProperty(
				"--ui-font",
				uiFont.family
			);
		}
	}, [selectedLightFont, selectedDarkFont, selectedQuoteFont, selectedUIFont, isDark, fontFollowsTheme]);

	// Load saved theme mode on mount
	useEffect(() => {
		const loadThemeMode = async () => {
			const saved = await storageService.getSettings();
			if (saved && saved.themeMode) {
				setSelectedThemeMode(saved.themeMode);
			}
		};
		loadThemeMode();
	}, []);

	// Save theme mode when it changes
	useEffect(() => {
		storageService.saveSettings({ themeMode: selectedThemeMode });
	}, [selectedThemeMode]);

	// Cycle theme mode
	const handleThemeModeChange = () => {
		setSelectedThemeMode((prev) =>
			prev === "system" ? "light" : prev === "light" ? "dark" : "system"
		);
	};

	// Apply theme mode override
	useEffect(() => {
		if (selectedThemeMode === "system") {
			document.documentElement.removeAttribute("data-color-scheme");
		} else {
			document.documentElement.setAttribute(
				"data-color-scheme",
				selectedThemeMode
			);
		}
	}, [selectedThemeMode]);

	// Handle font changes
	const handleQuoteFontChange = (font: string) => {
		setSelectedQuoteFont(font);
	};

	const handleUIFontChange = (font: string) => {
		setSelectedUIFont(font);
	};

	// Handle theme-specific font changes
	const handleLightFontChange = (font: string) => {
		setSelectedLightFont(font);
	};

	const handleDarkFontChange = (font: string) => {
		setSelectedDarkFont(font);
	};

	// Handle font follows theme toggle
	const handleFontFollowsThemeChange = (follows: boolean) => {
		setFontFollowsTheme(follows);
	};

	// Handle light theme change
	const handleLightThemeChange = (theme: string) => {
		setSelectedLightTheme(theme);
		// Apply immediately if currently in light mode
		if (
			selectedThemeMode === "light" ||
			(selectedThemeMode === "system" &&
				!window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			document.documentElement.setAttribute("data-theme", theme);
		}
		// Save to storage
		storageService.saveSettings({ selectedLightTheme: theme });
	};

	// Handle dark theme change
	const handleDarkThemeChange = (theme: string) => {
		setSelectedDarkTheme(theme);
		// Apply immediately if currently in dark mode
		if (
			selectedThemeMode === "dark" ||
			(selectedThemeMode === "system" &&
				window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			document.documentElement.setAttribute("data-theme", theme);
		}
		// Save to storage
		storageService.saveSettings({ selectedDarkTheme: theme });
	};

	// Handle semantic color theme change
	const handleSemanticThemeChange = (theme: string) => {
		setSelectedSemanticTheme(theme);
		// Save to storage
		storageService.saveSettings({ selectedSemanticTheme: theme });
	};

	// Apply appropriate DaisyUI theme based on mode
	useEffect(() => {
		const applyTheme = () => {
			const isDarkMode =
				selectedThemeMode === "dark" ||
				(selectedThemeMode === "system" &&
					window.matchMedia("(prefers-color-scheme: dark)").matches);
			const themeToApply = isDarkMode
				? selectedDarkTheme
				: selectedLightTheme;
			document.documentElement.setAttribute("data-theme", themeToApply);
		};

		applyTheme();

		// Listen for system preference changes when in system mode
		if (selectedThemeMode === "system") {
			const mediaQuery = window.matchMedia(
				"(prefers-color-scheme: dark)"
			);
			mediaQuery.addEventListener("change", applyTheme);
			return () => mediaQuery.removeEventListener("change", applyTheme);
		}
	}, [selectedThemeMode, selectedLightTheme, selectedDarkTheme]);

	// Load saved themes
	useEffect(() => {
		const loadThemes = async () => {
			const saved = await storageService.getSettings();
			if (saved) {
				if (saved.selectedLightTheme) {
					setSelectedLightTheme(saved.selectedLightTheme);
				}
				if (saved.selectedDarkTheme) {
					setSelectedDarkTheme(saved.selectedDarkTheme);
				}
			}
		};
		loadThemes();
	}, []);

	// Load saved semantic theme
	useEffect(() => {
		const loadSemanticTheme = async () => {
			const saved = await storageService.getSettings();
			if (saved && saved.selectedSemanticTheme) {
				setSelectedSemanticTheme(saved.selectedSemanticTheme);
			}
		};
		loadSemanticTheme();
	}, []);

	const refreshQuote = async () => {
		// Try to use prefetched quote first for instant refresh
		const prefetchedQuote = await storageService.consumePrefetchedQuote();

		if (prefetchedQuote) {
			// Use prefetched quote immediately - no loading state needed
			setQuote(prefetchedQuote);
			trackEvent("next_quote", { quote_source: prefetchedQuote.source });
			// Prefetch the next quote in the background
			quoteService.prefetchNextQuote();
		} else {
			// Fallback to fetching new quote with loading state
			setLoading(true);

			const newQuote = await quoteService.getRandomQuote();

			// Cache the new quote
			await storageService.cacheQuote({
				text: newQuote.text,
				author: newQuote.author,
				source: newQuote.source || "Unknown",
			});

			setQuote(newQuote);
			setLoading(false);
			trackEvent("next_quote", { quote_source: newQuote.source || "Unknown" });

			// Prefetch the next quote in the background
			quoteService.prefetchNextQuote();
		}
	};

	// Switching sources discards cached quotes and shows one from the new selection
	const handleEnabledSourcesChange = async (sources: QuoteSourceId[]) => {
		const next = sanitizeSources(sources);
		setEnabledSources(next);
		await storageService.saveSettings({ enabledSources: next });
		trackEvent("sources_changed", { enabled_sources: next.join(",") });
		await storageService.clearQuoteCache();
		await refreshQuote();
	};

	// Turning this off stops all analytics events (analytics.ts checks it before each send)
	const handleShareUsageStatsChange = async (share: boolean) => {
		setShareUsageStats(share);
		await storageService.saveSettings({ shareUsageStats: share });
	};

	// Count each new tab once, when its first quote is on screen
	useEffect(() => {
		if (!quote || trackedOpenRef.current) return;
		trackedOpenRef.current = true;
		trackEvent("new_tab", { quote_source: quote.source || "Unknown" });
	}, [quote]);

	// Explicitly use storage to ensure Chrome Web Store detects it
	const testStorageUsage = async () => {
		await storageService.getSettings();
	};

	// Get current background lightness based on theme mode
	const currentBackgroundLightness = isDark
		? backgroundLightnessDark
		: backgroundLightnessLight;

	// Handler for background lightness changes
	const handleBackgroundLightnessChange = (value: number) => {
		if (isDark) {
			setBackgroundLightnessDark(value);
		} else {
			setBackgroundLightnessLight(value);
		}
	};

	// Handler for font size changes
	const handleFontSizeChange = (value: number) => {
		setFontSize(value);
	};

	// Apply font size to CSS variables
	useEffect(() => {
		const fontStep = fontSizeSteps[fontSize];
		if (fontStep) {
			// Set CSS custom properties for responsive font sizes
			document.documentElement.style.setProperty(
				"--quote-font-size-base",
				fontStep.regular.base
			);
			document.documentElement.style.setProperty(
				"--quote-font-size-md",
				fontStep.regular.md
			);
			document.documentElement.style.setProperty(
				"--quote-font-size-lg",
				fontStep.regular.lg
			);
			document.documentElement.style.setProperty(
				"--quote-font-size-mono-base",
				fontStep.monospace.base
			);
			document.documentElement.style.setProperty(
				"--quote-font-size-mono-md",
				fontStep.monospace.md
			);
			document.documentElement.style.setProperty(
				"--quote-font-size-mono-lg",
				fontStep.monospace.lg
			);
		}
	}, [fontSize]);

	// Apply background lightness using CSS overlay
	useEffect(() => {
		// Calculate overlay opacity and color
		if (currentBackgroundLightness === 50) {
			// Remove overlay at neutral position
			document.documentElement.style.removeProperty("--bg-overlay-color");
			document.documentElement.style.removeProperty(
				"--bg-overlay-opacity"
			);
		} else if (currentBackgroundLightness > 50) {
			// Lighter: white overlay
			const opacity = ((currentBackgroundLightness - 50) / 50) * 0.8; // Max 80% opacity
			document.documentElement.style.setProperty(
				"--bg-overlay-color",
				"255, 255, 255"
			);
			document.documentElement.style.setProperty(
				"--bg-overlay-opacity",
				opacity.toString()
			);
		} else {
			// Darker: black overlay
			const opacity = ((50 - currentBackgroundLightness) / 50) * 0.8; // Max 80% opacity
			document.documentElement.style.setProperty(
				"--bg-overlay-color",
				"0, 0, 0"
			);
			document.documentElement.style.setProperty(
				"--bg-overlay-opacity",
				opacity.toString()
			);
		}
	}, [currentBackgroundLightness]);

	// Handle escape key to close settings panel
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && showSettings) {
				setShowSettings(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [showSettings]);

	// Open panel: show overlay and panel immediately
	useEffect(() => {
		if (showSettings) {
			setSettingsPanelVisible(true);
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
				closeTimeoutRef.current = null;
			}
		} else if (settingsPanelVisible) {
			// Wait for slide-out animation before unmounting
			closeTimeoutRef.current = setTimeout(() => {
				setSettingsPanelVisible(false);
			}, 300);
		}
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
				closeTimeoutRef.current = null;
			}
		};
	}, [showSettings]);

	// Fetch quote on mount - use cached quote if available and fresh
	useEffect(() => {
		const fetchQuote = async () => {
			setLoading(true);

			// Ensure storage is used (for Chrome Web Store detection)
			await testStorageUsage();

			// Try to get cached quote first
			const cachedQuote = await storageService.getCachedQuote();

			if (cachedQuote) {
				setQuote(cachedQuote);
				setLoading(false);

				// Check if we need to prefetch the next quote
				const prefetchedQuote =
					await storageService.getPrefetchedQuote();
				if (!prefetchedQuote) {
					// Prefetch in background if none exists
					quoteService.prefetchNextQuote();
				}
				return;
			}

			// If no cached quote, try prefetched quote before making API call
			const prefetchedQuote = await storageService.consumePrefetchedQuote();
			if (prefetchedQuote) {
				setQuote(prefetchedQuote);
				setLoading(false);
				// Prefetch the next quote in the background
				quoteService.prefetchNextQuote();
				return;
			}

			// If no cached or prefetched quote, fetch new one
			const newQuote = await quoteService.getTodaysQuote();

			// Cache the new quote
			await storageService.cacheQuote({
				text: newQuote.text,
				author: newQuote.author,
				source: newQuote.source || "Unknown",
			});

			setQuote(newQuote);
			setLoading(false);

			// Prefetch the next quote in the background
			quoteService.prefetchNextQuote();
		};

		fetchQuote();
	}, []);

	return (
		<div
			className={
				`min-h-screen w-full flex flex-col items-center justify-center bg-base-200 noise transition-colors duration-300 relative` +
				(isDark ? " text-base-content" : "")
			}
			style={{
				position: "relative",
			}}
		>
			{/* Background lightness overlay */}
			{currentBackgroundLightness !== 50 && (
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						backgroundColor: `rgba(var(--bg-overlay-color, 0, 0, 0), var(--bg-overlay-opacity, 0))`,
						zIndex: 0,
					}}
				/>
			)}
			{/* Settings button in bottom left */}
			<button
				className="btn btn-circle btn-ghost fixed bottom-6 left-6 z-50"
				onClick={() => setShowSettings(!showSettings)}
				title="Settings"
				aria-label="Open settings"
				aria-expanded={showSettings}
				aria-controls="settings-panel"
			>
				<span className="text-2xl">···</span>
			</button>

			{/* Refresh button in bottom right */}
			<button
				className="btn btn-circle btn-ghost fixed bottom-6 right-6 z-50"
				onClick={refreshQuote}
				disabled={loading}
				title="Refresh quote"
				aria-label={loading ? "Loading new quote..." : "Refresh quote"}
				aria-live="polite"
			>
				<span className="text-xl">↻</span>
			</button>

			{/* Main content */}
			<main className="flex flex-1 flex-col items-center justify-center w-full px-4 relative z-10">
				{quoteVisible ? (
					isPlainQuote ? (
						<PlainQuote
							quote={quote}
							loading={loading}
							selectedSemanticTheme={selectedSemanticTheme}
							selectedQuoteFont={fontFollowsTheme 
								? (isDark ? selectedDarkFont : selectedLightFont)
								: selectedQuoteFont}
						/>
					) : (
						<SwipeQuote
							quote={quote}
							loading={loading}
							onRefresh={refreshQuote}
							selectedSemanticTheme={selectedSemanticTheme}
							selectedQuoteFont={fontFollowsTheme 
								? (isDark ? selectedDarkFont : selectedLightFont)
								: selectedQuoteFont}
						/>
					)
				) : (
					<div className="text-center opacity-60 mt-20 text-lg">
						Quote hidden. Click the Daily Quill icon in the toolbar to show it.
					</div>
				)}
			</main>

			{/* Settings panel with overlay */}
			{settingsPanelVisible && (
				<div
					className="fixed inset-0 z-[1001] bg-transparent flex"
					onClick={(e) => {
						if (e.target === e.currentTarget)
							setShowSettings(false);
					}}
					aria-label="Settings overlay"
				>
					<SettingsPanel
						isOpen={showSettings}
						onClose={() => setShowSettings(false)}
						id="settings-panel"
						selectedThemeMode={selectedThemeMode}
						onThemeModeChange={handleThemeModeChange}
						selectedQuoteFont={selectedQuoteFont}
						onQuoteFontChange={handleQuoteFontChange}
						selectedUIFont={selectedUIFont}
						onUIFontChange={handleUIFontChange}
						selectedLightTheme={selectedLightTheme}
						selectedDarkTheme={selectedDarkTheme}
						onLightThemeChange={handleLightThemeChange}
						onDarkThemeChange={handleDarkThemeChange}
						selectedSemanticTheme={selectedSemanticTheme}
						onSemanticThemeChange={handleSemanticThemeChange}
						backgroundLightness={currentBackgroundLightness}
						onBackgroundLightnessChange={
							handleBackgroundLightnessChange
						}
						lightnessMin={0}
						lightnessMax={100}
						fontSize={fontSize}
						onFontSizeChange={handleFontSizeChange}
						fontSizeSteps={fontSizeSteps}
						selectedLightFont={selectedLightFont}
						onLightFontChange={handleLightFontChange}
						selectedDarkFont={selectedDarkFont}
						onDarkFontChange={handleDarkFontChange}
						fontFollowsTheme={fontFollowsTheme}
						onFontFollowsThemeChange={handleFontFollowsThemeChange}
						enabledSources={enabledSources}
						onEnabledSourcesChange={handleEnabledSourcesChange}
						shareUsageStats={shareUsageStats}
						onShareUsageStatsChange={handleShareUsageStatsChange}
					/>
				</div>
			)}
		</div>
	);
}

// Development wrapper component
const DevWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				background: "linear-gradient(135deg, #fdfdf8 0%, #f5f5f0 100%)",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Development indicator */}
			<div
				style={{
					position: "fixed",
					top: "10px",
					right: "10px",
					background: "rgba(255, 0, 0, 0.8)",
					color: "white",
					padding: "4px 8px",
					borderRadius: "4px",
					fontSize: "12px",
					fontFamily: "monospace",
					zIndex: 9999,
				}}
			>
				DEV MODE
			</div>
			{children}
		</div>
	);
};

// Main render logic
const rootElement = document.getElementById("newtab-root");
if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);

	if (isDev) {
		// Development mode - wrap in dev container
		root.render(
			<DevWrapper>
				<NewTabApp />
			</DevWrapper>
		);
	} else {
		// Extension mode - render directly
		root.render(<NewTabApp />);
	}
}
