// DaisyUI semantic color themes for different text emphasis
export const semanticColorThemes = {
	primary: {
		name: 'Primary',
		description: 'Main brand color emphasis',
		className: 'text-primary'
	},
	secondary: {
		name: 'Secondary',
		description: 'Supporting color emphasis',
		className: 'text-secondary'
	},
	accent: {
		name: 'Accent',
		description: 'Accent color emphasis',
		className: 'text-accent'
	},
	neutral: {
		name: 'Neutral',
		description: 'Subtle text that matches main content',
		className: 'text-base-content/50'
	}
};

// DaisyUI themes organized by light/dark categories
export const daisyThemeCategories = {
	light: {
		name: 'Light Themes',
		themes: [
			{ id: 'light', name: 'Default' },
			{ id: 'cupcake', name: 'Cupcake' },
			{ id: 'emerald', name: 'Emerald' },
			{ id: 'corporate', name: 'Corporate' },
			{ id: 'retro', name: 'Retro' },
			{ id: 'valentine', name: 'Valentine' },
			{ id: 'garden', name: 'Garden' },
			{ id: 'lofi', name: 'Lo-Fi' },
			{ id: 'pastel', name: 'Pastel' },
			{ id: 'fantasy', name: 'Fantasy' },
			{ id: 'wireframe', name: 'Wireframe' },
			{ id: 'cmyk', name: 'CMYK' },
			{ id: 'autumn', name: 'Autumn' },
			{ id: 'nord', name: 'Nord' },
			{ id: 'cyberpunk', name: 'Cyberpunk' },
			{ id: 'acid', name: 'Acid' },
			{ id: 'lemonade', name: 'Lemonade' },
			{ id: 'winter', name: 'Winter' }
		]
	},
	dark: {
		name: 'Dark Themes',
		themes: [
			{ id: 'dark', name: 'Default' },
			{ id: 'synthwave', name: 'Synthwave' },
			{ id: 'halloween', name: 'Halloween' },
			{ id: 'forest', name: 'Forest' },
			{ id: 'aqua', name: 'Aqua' },
			{ id: 'black', name: 'Black' },
			{ id: 'luxury', name: 'Luxury' },
			{ id: 'dracula', name: 'Dracula' },
			{ id: 'night', name: 'Night' },
			{ id: 'coffee', name: 'Coffee' },
			{ id: 'dim', name: 'Dim' },
			{ id: 'sunset', name: 'Sunset' },
			{ id: 'business', name: 'Business' }
		]
	}
};

// Font system for quotes and UI
export const quoteFonts = {
	classic: {
		name: 'Garamond',
		family: 'Cormorant Garamond, serif',
		googleFont: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500',
		category: 'serif'
	},
	modern: {
		name: 'Inter',
		family: 'Inter, sans-serif',
		googleFont: 'Inter:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400',
		category: 'sans-serif'
	},
	elegant: {
		name: 'Playfair',
		family: 'Playfair Display, serif',
		googleFont: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
		category: 'serif'
	},
	minimal: {
		name: 'Source Sans Pro',
		family: 'Source Sans Pro, sans-serif',
		googleFont: 'Source+Sans+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400',
		category: 'sans-serif'
	},
	poetry: {
		name: 'Lora',
		family: 'Lora, serif',
		googleFont: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
		category: 'serif'
	},
	monospace: {
		name: 'Ubuntu',
		family: 'Ubuntu Mono, monospace',
		googleFont: 'Ubuntu+Mono:wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500',
		category: 'monospace'
	}
};

export const uiFonts = {
	readable: {
		name: 'Readable',
		family: 'Inter, sans-serif',
		googleFont: 'Inter:wght@300;400;500;600'
	},
	clean: {
		name: 'Clean',
		family: 'Source Sans Pro, sans-serif',
		googleFont: 'Source+Sans+Pro:wght@300;400;500;600'
	},
	system: {
		name: 'System',
		family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		googleFont: null
	}
};

// Default font selections
export const defaultFonts = {
	quote: 'classic',
	ui: 'readable'
}; 