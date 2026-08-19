module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			cafe: {
  				'50': '#F7EDE4',
  				'100': '#EDD8C4',
  				'200': '#DDB898',
  				'300': '#C49470',
  				'400': '#A67850',
  				'500': '#8B5E3C',
  				'600': '#5C3D2A',
  				'700': '#4E3020',
  				'800': '#3D2418',
  				'900': '#2C1810',
  				'950': '#1C1008'
  			},
  			dorado: {
  				'100': '#F5EECE',
  				'200': '#EEDCB2',
  				'300': '#E2CA96',
  				'400': '#D4B87A',
  				'500': '#C6A75E',
  				'600': '#9A6B1A'
  			},
  			crema: {
  				DEFAULT: '#FAFAF8',
  				dark: '#F0EBE4',
  				darker: '#E8DDD4'
  			},
  			surface: {
  				DEFAULT: '#FFFFFF',
  				raised: '#FAFAF8',
  				border: '#E8DDD4'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: 'hsl(var(--destructive))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			display: [
  				'"Playfair Display"',
  				'Georgia',
  				'serif'
  			],
  			body: [
  				'"DM Sans"',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'"JetBrains Mono"',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '1rem'
  				}
  			]
  		},
  		boxShadow: {
  			'glow-cafe': '0 0 20px rgba(139,94,60,0.2)',
  			'glow-sm': '0 0 8px rgba(139,94,60,0.15)',
  			card: '0 1px 3px rgba(44,24,16,0.08), 0 1px 2px rgba(44,24,16,0.06)',
  			'card-hover': '0 4px 16px rgba(44,24,16,0.12), 0 1px 4px rgba(44,24,16,0.08)',
  			modal: '0 25px 50px rgba(44,24,16,0.25)',
  			sidebar: '2px 0 8px rgba(44,24,16,0.15)'
  		},
  		backgroundImage: {
  			'cafe-gradient': 'linear-gradient(135deg, #8B5E3C 0%, #2C1810 100%)',
  			'dorado-gradient': 'linear-gradient(135deg, #C6A75E 0%, #9A6B1A 100%)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-out',
  			'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  			shimmer: 'shimmer 1.5s infinite',
  			ripple: 'ripple 0.5s ease-out',
  			'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			ripple: {
  				'0%': {
  					transform: 'scale(0)',
  					opacity: '0.6'
  				},
  				'100%': {
  					transform: 'scale(2.5)',
  					opacity: '0'
  				}
  			},
  			slideInRight: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(40px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			}
  		},
  		transitionTimingFunction: {
  			spring: 'cubic-bezier(0.16, 1, 0.3, 1)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
