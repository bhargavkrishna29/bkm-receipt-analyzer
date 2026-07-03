import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="dark bg-[#050507] text-slate-200 min-h-screen overflow-x-hidden selection:bg-brand-500 selection:text-white" style={{ scrollBehavior: 'smooth' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass {
            background: rgba(20, 20, 25, 0.4);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .glass-panel {
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .text-gradient {
            background: linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .bg-gradient-mesh {
            background-image: 
                radial-gradient(at 40% 20%, rgba(45, 212, 191, 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 0% 50%, rgba(45, 212, 191, 0.1) 0px, transparent 50%);
        }
        .card-hover {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
            transform: translateY(-8px);
            border-color: rgba(45, 212, 191, 0.4);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(45, 212, 191, 0.15);
        }
        .btn-glow {
            position: relative;
        }
        .btn-glow::before {
            content: '';
            position: absolute;
            top: -2px; left: -2px; right: -2px; bottom: -2px;
            background: linear-gradient(45deg, #2dd4bf, #3b82f6, #2dd4bf);
            z-index: -1;
            filter: blur(10px);
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: inherit;
        }
        .btn-glow:hover::before {
            opacity: 0.8;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #050507;
        }
        ::-webkit-scrollbar-thumb {
            background: #1f2937;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #374151;
        }
      `}} />

      {/* Background Animated Blobs */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[0] overflow-hidden bg-gradient-mesh">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <header className="fixed top-0 w-full z-50 glass border-b-0 border-white/5 transition-all duration-300">
            <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-11 h-11 bg-white rounded-md flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Image src="/logo.png" alt="Lekha Tracker Logo" width={34} height={34} className="object-contain" unoptimized />
                    </div>
                    <span className="font-display font-bold text-2xl tracking-wide text-white group-hover:text-brand-300 transition-colors">Lekha Tracker</span>
                </Link>
                
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                        Features
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-400 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                        How it Works
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-400 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                        Success Stories
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-400 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign in</Link>
                    <Link href="/signup" className="btn-glow px-5 py-2.5 rounded-full bg-white text-dark-900 font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                        Get Started
                        <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </header>

        {/* Hero Section */}
        <main className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
            <div className="flex-1 z-10 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 mb-8">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                    </span>
                    <span className="text-xs font-medium text-brand-100 uppercase tracking-wider">AI Receipt Parsing is live</span>
                </div>
                
                <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-white">
                    Financial Intelligence,<br/>
                    <span className="text-gradient">Automated.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-[576px] leading-relaxed font-sans">
                    Transform chaotic receipts into actionable insights. Lekha Tracker automatically extracts data, categorizes spending, and provides a clear picture of your financial health.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/signup" className="btn-glow px-8 py-4 rounded-full bg-gradient-to-r from-brand-500 to-blue-600 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2">
                        Start Free Trial
                    </Link>
                    <a href="#demo" className="px-8 py-4 rounded-full glass text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 border border-white/10">
                        <span className="material-symbols-rounded">play_circle</span>
                        Watch Demo
                    </a>
                </div>

                <div className="mt-12 flex items-center gap-4">
                    <div className="flex -space-x-3">
                        <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-dark-900 z-30" />
                        <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-dark-900 z-20" />
                        <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-dark-900 z-10" />
                        <div className="w-10 h-10 rounded-full border-2 border-dark-900 bg-slate-800 flex items-center justify-center text-xs font-medium text-white z-0">+10k</div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-brand-400">
                            <span className="material-symbols-rounded text-[16px] fill-current">star</span>
                            <span className="material-symbols-rounded text-[16px] fill-current">star</span>
                            <span className="material-symbols-rounded text-[16px] fill-current">star</span>
                            <span className="material-symbols-rounded text-[16px] fill-current">star</span>
                            <span className="material-symbols-rounded text-[16px] fill-current">star</span>
                        </div>
                        <span className="text-sm text-slate-400 font-sans">Trusted by professionals</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative z-10 animate-float">
                <div className="relative w-full aspect-[4/3] rounded-2xl p-2 glass-panel shadow-2xl border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-blue-500/10 rounded-2xl"></div>
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" alt="Dashboard Preview" className="w-full h-full object-cover rounded-xl opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" />
                    
                    {/* Floating Card */}
                    <div className="absolute -bottom-6 -left-6 glass-panel rounded-xl p-5 shadow-2xl border border-white/10 animate-float-delayed w-64">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                                    <span className="material-symbols-rounded text-brand-400 text-[20px]">receipt_long</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Apple Store</p>
                                    <p className="text-xs text-slate-400">Electronics</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-end pt-3 border-t border-white/10">
                            <span className="text-xs text-slate-400">Processed</span>
                            <span className="font-display text-lg font-bold text-brand-400">$1,299.00</span>
                        </div>
                    </div>

                    {/* Floating Card 2 */}
                    <div className="absolute -top-6 -right-6 glass-panel rounded-xl p-4 shadow-2xl border border-white/10 animate-float w-48">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-green-400 text-[16px]">trending_up</span>
                                <span className="text-sm font-medium text-white">Monthly Savings</span>
                            </div>
                            <span className="font-display text-2xl font-bold text-white">+24.5%</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        {/* Features */}
        <section id="features" className="py-24 relative z-10">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">Everything you need for<br/><span className="text-gradient">total financial clarity</span></h2>
                    <p className="text-slate-400 text-lg max-w-[672px] mx-auto font-sans">Powerful tools designed specifically for professionals who need accuracy without the administrative headache.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="md:col-span-2 glass-panel rounded-3xl p-8 card-hover flex flex-col md:flex-row gap-8 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full filter blur-[80px] group-hover:bg-brand-500/20 transition-colors duration-500"></div>
                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-6">
                                <span className="material-symbols-rounded text-brand-400 text-2xl">document_scanner</span>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-white mb-4">Automatic Receipt Analysis</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed font-sans">Simply snap a photo or forward an email. Our proprietary AI instantly extracts merchant, date, tax, and total amounts with 99.9% accuracy.</p>
                            <a href="#" className="inline-flex items-center gap-2 text-brand-400 font-medium hover:text-brand-300 transition-colors mt-auto w-fit">
                                See how it works <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                            </a>
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden relative min-h-[250px]">
                            <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800" alt="Scanning receipt" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="glass-panel rounded-3xl p-8 card-hover flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full filter blur-[60px] group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center border border-white/10 mb-6 relative z-10">
                            <span className="material-symbols-rounded text-blue-400 text-2xl">pie_chart</span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white mb-4 relative z-10">Real-time Metrics</h3>
                        <p className="text-slate-400 mb-8 relative z-10 font-sans">Visualize your cash flow with dynamic charts. Track spending across categories instantly.</p>
                        
                        <div className="mt-auto glass rounded-xl p-5 border border-white/5 relative z-10">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs font-medium text-slate-400">This Month</span>
                                <span className="font-display font-bold text-blue-400 text-lg">$4,250</span>
                            </div>
                            <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden">
                                <div className="bg-blue-400 w-1/2"></div>
                                <div className="bg-brand-400 w-1/3"></div>
                                <div className="bg-purple-400 w-1/6"></div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="glass-panel rounded-3xl p-8 card-hover flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-[60px] group-hover:bg-purple-500/20 transition-colors duration-500"></div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center border border-white/10 mb-6 relative z-10">
                            <span className="material-symbols-rounded text-purple-400 text-2xl">account_balance</span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white mb-4 relative z-10">Smart Budgets</h3>
                        <p className="text-slate-400 mb-8 relative z-10 font-sans">Set category limits and get proactive alerts before you overspend. Never miss a target.</p>
                        
                        <div className="mt-auto relative z-10">
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span className="text-slate-300">Travel</span>
                                <span className="text-slate-400">85%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[85%] rounded-full relative">
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="md:col-span-2 glass-panel rounded-3xl p-8 card-hover flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4 transition-transform group-hover:scale-110 duration-700">
                            <span className="material-symbols-rounded text-[250px]">cloud_sync</span>
                        </div>
                        
                        <div className="flex-1 relative z-10">
                            <h3 className="font-display text-3xl font-bold text-white mb-4">Secure Cloud Sync</h3>
                            <p className="text-slate-400 mb-8 max-w-[448px] text-lg font-sans">Your data is encrypted and synced across all your devices in real-time. Access your financial intelligence from anywhere, securely.</p>
                            <ul className="space-y-4 font-sans">
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                                        <span className="material-symbols-rounded text-brand-400 text-[14px]">check</span>
                                    </div>
                                    Bank-level 256-bit encryption
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                                        <span className="material-symbols-rounded text-brand-400 text-[14px]">check</span>
                                    </div>
                                    Automatic daily backups
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                                        <span className="material-symbols-rounded text-brand-400 text-[14px]">check</span>
                                    </div>
                                    Export to CSV, PDF, or accounting software
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative z-10">
            <div className="max-w-[896px] mx-auto px-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400/20 to-blue-500/20 flex items-center justify-center border border-white/10 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-brand-500/20 filter blur-xl rounded-2xl"></div>
                    <span className="material-symbols-rounded text-brand-400 text-4xl relative z-10">rocket_launch</span>
                </div>
                <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">Ready to take control?</h2>
                <p className="text-xl text-slate-400 mb-10 max-w-[672px] mx-auto font-sans">Join thousands of professionals who have streamlined their expense tracking and gained clear financial intelligence.</p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <Link href="/signup" className="btn-glow px-10 py-5 rounded-full bg-white text-dark-900 font-bold text-lg hover:scale-105 transition-transform w-full sm:w-auto text-center shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        Start Your Free Trial
                    </Link>
                    <div className="text-left text-sm text-slate-400 flex flex-col justify-center font-sans">
                        <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[16px] text-brand-400">check_circle</span> No credit card required</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[16px] text-brand-400">check_circle</span> 14-day free trial</span>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 pb-8 relative z-10 bg-dark-900/50 backdrop-blur-lg">
            <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center">
                        <span className="material-symbols-rounded text-white text-[16px]">insights</span>
                    </div>
                    <span className="font-display font-medium text-white">Lekha Tracker © 2024</span>
                </div>
                
                <div className="flex gap-8">
                    <a href="#" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Terms of Service</a>
                    <a href="#" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Contact Support</a>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
}
