
export default function HomePage() {
  return (
    <>
      
{/* Top Navigation (Landing Page Version) */}
<header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant transition-all duration-300">
<div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop h-20 flex items-center justify-between">
<div className="flex items-center gap-2">
<img alt="Lekha Tracker Logo" className="h-12 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMEmwQJVDQVfGITFEyI3uBNhPN6Co2ugnqCHDMEVDKNpUjEMbY4fhZkYgBJ1D9CToTDuLvP7QfTS_Y6Y4Ft-9xHtiGpbGJSx1w0_-sFmk7hMlWtGUbDC2JDj2Sq2sGpe9jn5GvzlWLjsUDToyFQ8bAiAHZbP4xjeYmifwjs3SMsVUGsgdUEAWFrgGpiE5F9Wzq8IsYoNhQTQQn9gKxhw9CocwIFY5oShPgkOwFC7eOXoiFj1EDcSft4SDkg0oeXDA5e5GWYRGN9GhT"/>
</div>
<nav className="hidden md:flex items-center gap-lg">
<a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
<a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
<a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#testimonials">Success Stories</a>
</nav>
<div className="flex items-center gap-md">
<a className="hidden md:block font-label-md text-label-md text-primary hover:bg-surface-container py-2 px-4 rounded transition-colors" href="/login">Login</a>
<a className="bg-primary text-on-primary font-label-md text-label-md py-2 px-6 rounded-lg hover:bg-primary-container transition-all shadow-sm hover:shadow flex items-center gap-2" href="/signup">
                    Get Started
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
</div>
</header>
<main className="flex-grow flex flex-col items-center w-full">
{/* Hero Section */}
<section className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative overflow-hidden">
{/* Abstract background shape */}
<div className="absolute -z-10 top-0 right-0 w-[800px] h-[800px] bg-surface-variant rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
<div className="flex-1 flex flex-col items-start z-10">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant mb-6">
<span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
<span className="font-label-md text-label-md text-on-surface-variant">New: AI Receipt Parsing</span>
</div>
<h1 className="font-display-lg text-display-lg text-on-background mb-6 leading-tight">
                    Financial Intelligence, <br/>
<span className="text-gradient">Automated.</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
                    Transform chaotic receipts into actionable insights. Lekha Tracker automatically extracts data, categorizes spending, and provides a clear picture of your financial health.
                </p>
<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
<a className="bg-primary text-on-primary font-label-md text-label-md py-4 px-8 rounded-lg hover:bg-primary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-center" href="/signup">
                        Start Free Trial
                    </a>
<a className="bg-surface-container-lowest text-primary border border-outline-variant font-label-md text-label-md py-4 px-8 rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-center" href="#demo">
<span className="material-symbols-outlined text-lg">play_circle</span>
                        Watch Demo
                    </a>
</div>
<div className="mt-12 flex items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
<div className="flex -space-x-2">
<img className="w-8 h-8 rounded-full border-2 border-surface object-cover" data-alt="A small, professional headshot portrait of a business person in a modern corporate setting, smiling, well-lit, high resolution, light background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5aSs6S8Dc4x468AeKqU0qkRAJS_uEGQ2B_GUeDWRfub2fmTHRshmwkX5V45S1DMk9MNOwcvYCis1Hd3AQ6ksqvRIBzUjanNgVe14CbdcdMnlNidFYRaeNsNLHUndvqwDiPLjXu9uVcrqMUO6fFygBuP8k9MehVqOYNn0i1qyZQv-8Dkzvq9-jaVW40CPMARH2OS03S2URf5yTN2q-dbPAHzoheia_IQPIzne9AxDqjzcqZJuL7PmNmsKixY7xQd-LSpsXXwbP3D7E"/>
<img className="w-8 h-8 rounded-full border-2 border-surface object-cover" data-alt="A small, professional headshot portrait of a creative professional in a bright studio setting, neutral lighting, high resolution, corporate style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtvXxCqS7jUqWQtBaIih2O7s_ZT1xQzduO9OGkgmHmW2K1jTEx5Cq1w54XdrTNXGy0qpMrJ0idwHQAWcYvJc9VkqzUhhg768gSonLCNr1Jj94wWjV5Lb3ncUajAwCeG8WoS0-mZ_BaGiYkZbziW0tIAwFUAkh8vb3g676_ak-zk2t08fkdnKrRwmxZ6Y6Cd5gVU1MPiveQuFWez7WnN1RfupcUn6nD975ZZf1t7Z1AGZ3OC8jHfOCXHGJeB8trZRvCNQHB2a0drGe-"/>
<img className="w-8 h-8 rounded-full border-2 border-surface object-cover" data-alt="A small, professional headshot portrait of an entrepreneur looking confident, modern office backdrop, soft natural light, professional aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdp5yOS1yA4mmgdlooGXSkv4NvKAfbVmiFa2tLftUvAa1W5beCyDZDQUYTfuaefV4wYg-HSdQik2DoPLu35W4_WWUnWsuFqsAkWR83S3y1wxk5OZHRiPbuDe-nfZgkiTPUh3DMV2wJBxZah0bSd7P7NjNgOIPYDXqKn8IBSiBwoC43srsfI1522_NduA6bO_dH5mMCRSrvCyNe4wXC6ZTy5WzW3T1fKRfTDkubAlns6rzbw4p6TyyrG-GfQxfivgymfUsQwVhhhBjb"/>
</div>
<span>Trusted by 10,000+ professionals</span>
</div>
</div>
<div className="flex-1 w-full relative z-10">
<div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-outline-variant bg-surface-container">
{/* Dashboard Mockup Image */}
<img className="w-full h-full object-cover" data-alt="A highly detailed, professional UI design mockup of a financial dashboard application displayed on a modern laptop screen. The dashboard features clean charts, clean modern typography, blue and green brand colors, data tables showing expenses, and receipt scans. The setting is a clean, bright, modern home office desk with soft natural lighting and minimalist decor." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_TUu-ihqIKIndtFhdUF9B2Hmzk2A38gD6HN4aNmVKcmO4cqT-h_Ay-yUPDofzwAUoJWpMFmlavzkBiTj2JscNVi8DRDabsMGs6bOiU7AowHDxkQQrgDMdK2dYsxnjsK8B90KPg4HKG3dSBGXXkEdgZ20nIzqD4eY7XWroPwSY2mue3P1XVNLdFYwPuf-Mb9xtsdj8Ea483bcYPgXrV8SDAMTnyqS6ZGUEH9SYhAj-3cNYUtjOuDYF_4vghKrS4vUuTPXXbpW3dlON"/>
{/* Floating UI Card overlay to show off styling */}
<div className="absolute bottom-6 left-6 glass-card rounded-xl p-4 shadow-lg animate-bounce" style={{"animationDuration":"3s"}}>
<div className="flex items-center gap-3 mb-2">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-on-secondary-container" style={{"fontVariationSettings":"'FILL' 1"}}>check_circle</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">Receipt Processed</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Starbucks Coffee</p>
</div>
</div>
<div className="flex justify-between items-end mt-2 pt-2 border-t border-outline-variant">
<span className="font-body-sm text-body-sm text-on-surface-variant">Amount</span>
<span className="font-numeric-data text-numeric-data text-on-background">$12.50</span>
</div>
</div>
</div>
</div>
</section>
{/* Features Bento Grid */}
<section className="w-full bg-surface-container-lowest py-24" id="features">
<div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
<div className="text-center mb-16 max-w-2xl mx-auto">
<h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Everything you need for total financial clarity</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Powerful tools designed specifically for professionals who need accuracy without the administrative headache.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
{/* Feature 1: Automatic Analysis (Large span) */}
<div className="md:col-span-2 bg-surface border border-outline-variant rounded-2xl p-8 flex flex-col sm:flex-row gap-8 hover:shadow-md transition-shadow">
<div className="flex-1 flex flex-col justify-center">
<div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-on-primary-container text-2xl" style={{"fontVariationSettings":"'FILL' 1"}}>document_scanner</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-background mb-3">Automatic Receipt Analysis</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">Simply snap a photo or forward an email. Our proprietary AI instantly extracts merchant, date, tax, and total amounts with 99.9% accuracy.</p>
<a className="font-label-md text-label-md text-primary flex items-center gap-1 hover:underline mt-auto" href="#">
                                See how it works <span className="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
<div className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden relative min-h-[200px]">
<img className="w-full h-full object-cover absolute inset-0" data-alt="A close-up, high-quality photograph of a smartphone screen scanning a crisp white paper receipt laying on a clean wooden desk. The screen shows a green scanning overlay, highlighting text like prices and dates. The lighting is bright and professional, emphasizing modern technology and financial tracking." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBagbe_pXiBOkBjq3BrAgdZE1xQUn_u5o4c24-FJLJ0_rwB9R7R4kdO7wfBHr1sdQyUBVo2VFSAx4hZRNtaQNhqHzMMC5s19sPLiEn5LJ7B5mDNL64WfWTmWPc9RXk1gLa_iV1HVUf9bGUJR7ls4yv7vKDQTyfTxViKg2UvtKHhvRAfHuh21jtjL_6Xs2I6rI5LaPwTpm2PUScRKHyiRFipkYuPCxJgQL-qIekNgbWm7FiAtlAYYuzJWdioeNCr0-GSYzpbzlcq8Qa8"/>
</div>
</div>
{/* Feature 2: Spending Metrics */}
<div className="bg-surface border border-outline-variant rounded-2xl p-8 flex flex-col hover:shadow-md transition-shadow">
<div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-on-secondary-container text-2xl" style={{"fontVariationSettings":"'FILL' 1"}}>pie_chart</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-background mb-3">Real-time Metrics</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">Visualize your cash flow with dynamic charts. Track spending across categories instantly.</p>
{/* Mini Chart Visualization */}
<div className="mt-auto bg-surface-container-low rounded-lg p-4 border border-outline-variant">
<div className="flex justify-between items-end mb-2">
<span className="font-body-sm text-body-sm text-on-surface-variant">This Month</span>
<span className="font-numeric-data text-numeric-data text-secondary flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span> $4,250</span>
</div>
<div className="flex gap-1 h-2 w-full rounded-full overflow-hidden">
<div className="bg-secondary-fixed-dim w-1/2"></div>
<div className="bg-primary-fixed-dim w-1/3"></div>
<div className="bg-tertiary-fixed-dim w-1/6"></div>
</div>
</div>
</div>
{/* Feature 3: Budget Management */}
<div className="bg-surface border border-outline-variant rounded-2xl p-8 flex flex-col hover:shadow-md transition-shadow">
<div className="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-6">
<span className="material-symbols-outlined text-on-tertiary-fixed text-2xl" style={{"fontVariationSettings":"'FILL' 1"}}>account_balance</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-background mb-3">Smart Budgets</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">Set category limits and get proactive alerts before you overspend. Never miss a target.</p>
<div className="mt-auto">
<div className="flex justify-between font-label-md text-label-md mb-1">
<span className="text-on-surface">Travel</span>
<span className="text-on-surface-variant">85%</span>
</div>
<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-tertiary-container h-full w-[85%] rounded-full"></div>
</div>
</div>
</div>
{/* Feature 4: Cloud Sync (Large span) */}
<div className="md:col-span-2 bg-inverse-surface rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
<div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 transition-transform group-hover:scale-110 duration-700">
<span className="material-symbols-outlined text-[200px]" style={{"fontVariationSettings":"'FILL' 1"}}>cloud_sync</span>
</div>
<div className="flex-1 relative z-10">
<h3 className="font-headline-md text-headline-md text-inverse-on-surface mb-3">Secure Cloud Sync</h3>
<p className="font-body-md text-body-md text-surface-variant mb-6 max-w-md">Your data is encrypted and synced across all your devices in real-time. Access your financial intelligence from anywhere, securely.</p>
<ul className="space-y-3 mb-6">
<li className="flex items-center gap-2 text-surface-dim font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary-fixed text-sm">check</span> Bank-level 256-bit encryption
                                </li>
<li className="flex items-center gap-2 text-surface-dim font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary-fixed text-sm">check</span> Automatic daily backups
                                </li>
<li className="flex items-center gap-2 text-surface-dim font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary-fixed text-sm">check</span> Export to CSV, PDF, or accounting software
                                </li>
</ul>
</div>
</div>
</div>
</div>
</section>
{/* CTA Section */}
<section className="w-full bg-surface py-24 border-t border-outline-variant">
<div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
<span className="material-symbols-outlined text-primary text-5xl mb-6" style={{"fontVariationSettings":"'FILL' 1"}}>insights</span>
<h2 className="font-display-lg text-display-lg text-on-background mb-6">Ready to take control?</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">Join thousands of professionals who have streamlined their expense tracking and gained clear financial intelligence with Lekha Tracker.</p>
<div className="flex flex-col sm:flex-row justify-center gap-4">
<a className="bg-primary text-on-primary font-label-md text-label-md py-4 px-10 rounded-lg hover:bg-primary-container transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2" href="/signup">
                        Start Your Free Trial
                    </a>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center sm:ml-4">
                        No credit card required. <br className="sm:hidden"/>14-day free trial.
                    </p>
</div>
</div>
</section>
</main>
{/* Footer */}
<footer className="w-full bg-surface-container-lowest border-t border-outline-variant py-12">
<div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-xl" style={{"fontVariationSettings":"'FILL' 1"}}>account_balance_wallet</span>
<span className="font-label-md text-label-md text-on-surface">Lekha Tracker © 2024</span>
</div>
<div className="flex gap-6">
<a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
<a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
</div>
</div>
</footer>

    </>
  );
}
