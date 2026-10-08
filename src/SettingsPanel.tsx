import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	quoteFonts,
	uiFonts,
	semanticColorThemes,
	daisyThemeCategories,
} from "./colors";
import DayNightSwitch from "./components/DayNightSwitch";
import { MoonIcon, SunIcon } from "./components/Icons";
import { SupportModal } from "./components/SupportModal";
import {
	quoteSources,
	quoteSourceCategories,
	type QuoteSourceCategory,
	type QuoteSourceId,
} from "./sources";

interface SettingsPanelProps {
	isOpen: boolean;
	onClose: () => void;
	selectedSemanticTheme: string;
	onSemanticThemeChange: (theme: string) => void;
	id?: string;
	selectedThemeMode: "system" | "light" | "dark";
	onThemeModeChange: () => void;
	selectedQuoteFont: string;
	onQuoteFontChange: (font: string) => void;
	selectedUIFont: string;
	onUIFontChange: (font: string) => void;
	// Theme-specific font preferences
	selectedLightFont: string;
	onLightFontChange: (font: string) => void;
	selectedDarkFont: string;
	onDarkFontChange: (font: string) => void;
	// Font behavior preference
	fontFollowsTheme: boolean;
	onFontFollowsThemeChange: (follows: boolean) => void;
	selectedLightTheme: string;
	selectedDarkTheme: string;
	onLightThemeChange: (theme: string) => void;
	onDarkThemeChange: (theme: string) => void;
	backgroundLightness: number;
	onBackgroundLightnessChange: (lightness: number) => void;
	lightnessMin: number;
	lightnessMax: number;
	fontSize: number;
	onFontSizeChange: (size: number) => void;
	fontSizeSteps: {
		name: string;
		regular: { base: string; md: string; lg: string };
		monospace: { base: string; md: string; lg: string };
	}[];
	enabledSources: QuoteSourceId[];
	onEnabledSourcesChange: (sources: QuoteSourceId[]) => void;
	shareUsageStats: boolean;
	onShareUsageStatsChange: (share: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
	isOpen,
	onClose,
	selectedSemanticTheme,
	onSemanticThemeChange,
	id,
	selectedThemeMode,
	onThemeModeChange,
	selectedQuoteFont,
	onQuoteFontChange,
	selectedUIFont,
	onUIFontChange,
	selectedLightFont,
	onLightFontChange,
	selectedDarkFont,
	onDarkFontChange,
	fontFollowsTheme,
	onFontFollowsThemeChange,
	selectedLightTheme,
	selectedDarkTheme,
	onLightThemeChange,
	onDarkThemeChange,
	backgroundLightness,
	onBackgroundLightnessChange,
	lightnessMin,
	lightnessMax,
	fontSize,
	onFontSizeChange,
	fontSizeSteps,
	enabledSources,
	onEnabledSourcesChange,
	shareUsageStats,
	onShareUsageStatsChange,
}) => {
	// Shared style constants
	const styles = {
		sectionTitle: "label text-md font-semibold",
		sectionContainer: "flex flex-col gap-3",
		divider: "divider my-0",
		row: "flex items-center gap-3 min-h-8",
		rowLabel: "w-20 shrink-0 text-sm",
	};

	const radioColorClasses: Record<string, string> = {
		primary: "radio-primary",
		secondary: "radio-secondary",
		accent: "radio-accent",
		neutral: "radio-neutral",
	};

	// Theme and font pickers edit the choice for whichever mode is showing
	const isDarkMode =
		selectedThemeMode === "dark" ||
		(selectedThemeMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	const currentThemeCategory = isDarkMode
		? daisyThemeCategories.dark
		: daisyThemeCategories.light;
	const selectedTheme = isDarkMode ? selectedDarkTheme : selectedLightTheme;
	const onThemeChange = isDarkMode ? onDarkThemeChange : onLightThemeChange;
	const selectedFont = fontFollowsTheme
		? isDarkMode
			? selectedDarkFont
			: selectedLightFont
		: selectedQuoteFont;
	const onFontChange = fontFollowsTheme
		? isDarkMode
			? onDarkFontChange
			: onLightFontChange
		: onQuoteFontChange;

	// Focus management
	React.useEffect(() => {
		if (isOpen) {
			const closeBtn = document.querySelector(
				".settings-panel .close-btn"
			) as HTMLButtonElement;
			if (closeBtn) {
				closeBtn.focus();
			}
		}
	}, [isOpen]);

	React.useEffect(() => {
		if (!isOpen) return;
		const panel = document.querySelector(".settings-panel") as HTMLElement;
		const focusableElements = panel?.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		) as NodeListOf<HTMLElement>;
		if (!focusableElements.length) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key === "Tab") {
				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			}
		};
		document.addEventListener("keydown", handleTabKey);
		return () => document.removeEventListener("keydown", handleTabKey);
	}, [isOpen]);

	// Animation variants for the settings panel
	const panelVariants = {
		hidden: {
			x: "-100%",
		},
		visible: {
			x: 0,
		},
	};

	const themeMode =
		selectedThemeMode === "light"
			? "Light"
			: selectedThemeMode === "dark"
			? "Dark"
			: "System";

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					id={id}
					className="settings-panel fixed top-0 left-0 h-full max-w-[400px] w-full z-[1002] bg-base-200 noise shadow-2xl flex flex-col"
					role="dialog"
					aria-modal="true"
					aria-labelledby="settings-title"
					aria-describedby="settings-description"
					variants={panelVariants}
					initial="hidden"
					animate="visible"
					exit="hidden"
					transition={{
						duration: 0.3,
						ease: "easeInOut",
					}}
				>
					<div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
						<h3 id="settings-title" className="text-2xl font-bold">
							Settings
						</h3>
						<div className="flex items-center gap-2">
							<DayNightSwitch
								selectedThemeMode={selectedThemeMode}
								onThemeModeChange={onThemeModeChange}
							/>
							<button
								className="close-btn btn btn-ghost btn-circle"
								onClick={onClose}
								aria-label="Close settings"
							>
								<span className="text-xl">✕</span>
							</button>
						</div>
					</div>
					<div
						className="settings-content p-6 flex flex-col gap-6 overflow-y-auto flex-1 min-h-0"
						id="settings-description"
					>
						<div className={styles.sectionContainer}>
							<label className={styles.sectionTitle}>
								Quote Sources
							</label>
							{(
								Object.keys(
									quoteSourceCategories
								) as QuoteSourceCategory[]
							).map((category) => (
								<div key={category} className="flex flex-col gap-2">
									<span className="text-xs uppercase tracking-wide opacity-60">
										{quoteSourceCategories[category]}
									</span>
									{quoteSources
										.filter(
											(source) =>
												source.category === category
										)
										.map((source) => {
											const isEnabled =
												enabledSources.includes(
													source.id
												);
											// Keep at least one source enabled
											const isLastEnabled =
												isEnabled &&
												enabledSources.length === 1;
											return (
												<label
													key={source.id}
													className="flex items-center justify-between gap-4 cursor-pointer"
												>
													<span className="flex flex-col">
														<span className="text-sm font-medium">
															{source.name}
														</span>
														<span className="text-xs opacity-60">
															{source.description}
														</span>
													</span>
													<input
														type="checkbox"
														className="toggle toggle-primary toggle-sm"
														checked={isEnabled}
														disabled={isLastEnabled}
														title={
															isLastEnabled
																? "At least one source must stay enabled"
																: undefined
														}
														onChange={(e) =>
															onEnabledSourcesChange(
																e.target.checked
																	? [
																			...enabledSources,
																			source.id,
																	  ]
																	: enabledSources.filter(
																			(id) =>
																				id !==
																				source.id
																	  )
															)
														}
														aria-label={`Show quotes from ${source.name}`}
													/>
												</label>
											);
										})}
								</div>
							))}
						</div>
						<div className={styles.divider} />
						<div className="flex flex-col gap-2">
							<label className={styles.sectionTitle}>
								Appearance
							</label>
							<div className={styles.row}>
								<label
									htmlFor="settings-theme"
									className={styles.rowLabel}
								>
									Theme
								</label>
								<select
									id="settings-theme"
									className="select select-sm flex-1"
									value={selectedTheme}
									onChange={(e) =>
										onThemeChange(e.target.value)
									}
								>
									{currentThemeCategory.themes.map(
										(theme) => (
											<option
												key={theme.id}
												value={theme.id}
											>
												{theme.name}
											</option>
										)
									)}
								</select>
							</div>
							<div className={styles.row}>
								<span className={styles.rowLabel}>Color</span>
								<div
									className="flex flex-1 gap-3"
									role="radiogroup"
									aria-label="Quote color"
								>
									{Object.entries(semanticColorThemes).map(
										([key, color]) => (
											<input
												key={key}
												type="radio"
												name="semantic-theme"
												className={`radio radio-sm ${
													radioColorClasses[key] ??
													"radio-primary"
												}`}
												checked={
													selectedSemanticTheme ===
													key
												}
												onChange={() =>
													onSemanticThemeChange(key)
												}
												title={color.name}
												aria-label={color.name}
											/>
										)
									)}
								</div>
							</div>
							<div className={styles.row}>
								<span className={styles.rowLabel}>
									Brightness
								</span>
								<div className="flex flex-1 items-center gap-2">
									<span className="opacity-70" title="Dark">
										<MoonIcon />
									</span>
									<input
										type="range"
										min={lightnessMin}
										max={lightnessMax}
										value={backgroundLightness}
										onChange={(e) =>
											onBackgroundLightnessChange(
												Number(e.target.value)
											)
										}
										className="range range-primary range-xs flex-1"
										aria-label="Background brightness"
										title={`${backgroundLightness}%`}
									/>
									<span className="opacity-70" title="Light">
										<SunIcon />
									</span>
								</div>
							</div>
							<div className={styles.row}>
								<label
									htmlFor="settings-font"
									className={styles.rowLabel}
								>
									Font
								</label>
								<select
									id="settings-font"
									className="select select-sm flex-1 min-w-0"
									value={selectedFont}
									onChange={(e) =>
										onFontChange(e.target.value)
									}
									style={{
										fontFamily:
											quoteFonts[
												selectedFont as keyof typeof quoteFonts
											]?.family,
									}}
								>
									{Object.entries(quoteFonts).map(
										([key, font]) => (
											<option
												key={key}
												value={key}
												style={{
													fontFamily: font.family,
												}}
											>
												{font.name}
											</option>
										)
									)}
								</select>
								<label
									className="flex items-center gap-1 cursor-pointer"
									title={
										fontFollowsTheme
											? "Separate fonts for light and dark mode"
											: "Same font in light and dark mode"
									}
								>
									<span className="text-xs opacity-70">
										Per mode
									</span>
									<input
										type="checkbox"
										className="toggle toggle-primary toggle-xs"
										checked={fontFollowsTheme}
										onChange={(e) =>
											onFontFollowsThemeChange(
												e.target.checked
											)
										}
										aria-label="Font follows theme"
									/>
								</label>
							</div>
							<div className={styles.row}>
								<span className={styles.rowLabel}>Size</span>
								<div className="flex flex-1 items-center gap-2">
									<span
										className="text-xs opacity-70 font-bold"
										title="Small"
									>
										Aa
									</span>
									<input
										type="range"
										min={0}
										max={fontSizeSteps.length - 1}
										step={1}
										value={fontSize}
										onChange={(e) =>
											onFontSizeChange(
												Number(e.target.value)
											)
										}
										className="range range-primary range-xs flex-1"
										aria-label="Font size"
										title={fontSizeSteps[fontSize]?.name}
									/>
									<span
										className="text-lg opacity-70 font-bold"
										title="Large"
									>
										Aa
									</span>
								</div>
							</div>
						</div>
						<div className={styles.divider} />
						<div className={styles.sectionContainer}>
							<div className="flex items-center justify-between">
								<label className={styles.sectionTitle}>
									Share anonymous usage stats
								</label>
								<input
									type="checkbox"
									className="toggle toggle-primary toggle-sm"
									checked={shareUsageStats}
									onChange={(e) => onShareUsageStatsChange(e.target.checked)}
									aria-label="Share anonymous usage stats"
								/>
							</div>
							<p className="text-sm opacity-70">
								Counts new tabs and which quote sources are used. No quotes, browsing history or personal details are sent.
							</p>
						</div>
					</div>

					{/* Footer Support */}
					<div className="px-6 py-4 flex-shrink-0 relative">
						<div className="flex justify-center">
							<SupportModal />
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
