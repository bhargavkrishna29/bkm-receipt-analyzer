'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  // Demo State
  const [isDragging, setIsDragging] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoPreview, setDemoPreview] = useState<string | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Features Tour State
  const [activeFeature, setActiveFeature] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setDemoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Call API
    setDemoLoading(true);
    setDemoError(null);
    setDemoResult(null);

    try {
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      base64Reader.onload = async () => {
        const result = base64Reader.result as string;
        const base64Data = result.split(',')[1];
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mediaType: file.type,
            existingExpenses: [] // No history for the demo
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze receipt');
        }

        setDemoResult(data);
      };
    } catch (err: any) {
      setDemoError(err.message || 'Something went wrong.');
    } finally {
      setDemoLoading(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      alert("Camera access denied or unavailable. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-receipt.jpg", { type: "image/jpeg" });
            stopCamera();
            handleFileChange(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const features = [
    {
        title: "Bento-style Dashboard",
        icon: "dashboard",
        color: "text-brand-400",
        bgColor: "bg-brand-500/20",
        borderColor: "border-brand-500/30",
        description: "A beautiful, at-a-glance dashboard that shows your total spent, remaining budget, average spend per receipt, and top merchants.",
        mockUi: (
            <div className="grid grid-cols-2 gap-4 h-full">
                <div className="col-span-2 glass border border-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <p className="text-slate-400 text-xs uppercase mb-1">Total Spent</p>
                        <p className="text-white text-3xl font-display font-bold">$4,250.00</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase mb-1">Remaining Budget</p>
                        <p className="text-brand-400 text-2xl font-bold">$750.00</p>
                    </div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-slate-400 text-xs uppercase mb-2">Top Merchant</p>
                    <p className="text-white font-bold mb-1">Apple Store</p>
                    <p className="text-xs text-slate-500">2 purchases</p>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-slate-400 text-xs uppercase mb-2">Top Category</p>
                    <p className="text-white font-bold mb-1">Electronics</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                        <div className="bg-brand-400 w-3/4 h-full rounded-full"></div>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Multi-Currency Tracking",
        icon: "currency_exchange",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
        description: "Scan receipts in Euros, Dollars, or SEK. Lekha Tracker automatically converts all amounts to your preferred base currency.",
        mockUi: (
            <div className="flex flex-col gap-3 h-full justify-center">
                <div className="glass border border-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-white border border-white/10">€</div>
                        <div>
                            <p className="text-white font-medium">Dinner in Paris</p>
                            <p className="text-xs text-slate-400">EUR • Yesterday</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold">€120.00</p>
                        <p className="text-xs text-brand-400">≈ $131.40 USD</p>
                    </div>
                </div>
                <div className="glass border border-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-white border border-white/10">kr</div>
                        <div>
                            <p className="text-white font-medium">Fika in Stockholm</p>
                            <p className="text-xs text-slate-400">SEK • Last Week</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold">450 kr</p>
                        <p className="text-xs text-brand-400">≈ $43.20 USD</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Smart AI Insights",
        icon: "tips_and_updates",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500/30",
        description: "The AI doesn't just read receipts—it analyzes your habits and gives personalized tips to optimize your spending.",
        mockUi: (
            <div className="flex flex-col h-full justify-center">
                <div className="glass border border-purple-500/30 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 blur-2xl rounded-full"></div>
                    <div className="flex items-start gap-3 mb-4">
                        <span className="material-symbols-rounded text-purple-400">auto_awesome</span>
                        <div>
                            <p className="text-white font-medium mb-1">Saving Opportunity Found</p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                You have spent $145.00 on coffee shops this month across 24 receipts. Try making coffee at home twice a week to save approximately $45/month.
                            </p>
                        </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Potential Annual Savings</span>
                        <span className="text-purple-400 font-bold">$540.00</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Advanced Search",
        icon: "manage_search",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
        description: "Search not just by merchant, but by specific line items across all your receipts (e.g. 'Coffee' or 'Laptop').",
        mockUi: (
            <div className="flex flex-col h-full">
                <div className="bg-slate-900 rounded-lg border border-white/10 p-2 mb-4 flex items-center gap-2">
                    <span className="material-symbols-rounded text-slate-400 text-[20px] ml-2">search</span>
                    <span className="text-white font-medium text-sm border-r border-white/20 pr-2">"Laptop charger"</span>
                    <span className="text-xs text-slate-500">Searching all line items...</span>
                </div>
                
                <div className="space-y-3">
                    <div className="glass border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="text-white font-medium text-sm">Best Buy</p>
                            <p className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded inline-block mt-1">Matched item: 65W USB-C Charger</p>
                        </div>
                        <p className="text-white font-bold text-sm">$49.99</p>
                    </div>
                    <div className="glass border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="text-white font-medium text-sm">Amazon</p>
                            <p className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded inline-block mt-1">Matched item: Laptop Power Cable</p>
                        </div>
                        <p className="text-white font-bold text-sm">$15.50</p>
                    </div>
                </div>
            </div>
        )
    }
  ];

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
                    <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                        How it Works
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-400 transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    <a href="#demo" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                        Live Product Demo
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
                    <span className="text-xs font-medium text-brand-100 uppercase tracking-wider">Powered by Gemini AI</span>
                </div>
                
                <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-white">
                    Financial Intelligence,<br/>
                    <span className="text-gradient">Automated.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-[576px] leading-relaxed font-sans">
                    Transform chaotic receipts into actionable insights. Lekha Tracker automatically extracts data, categorizes spending, handles multi-currency conversions, and provides a clear picture of your financial health.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/signup" className="btn-glow px-8 py-4 rounded-full bg-gradient-to-r from-brand-500 to-blue-600 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2">
                        Start Free Trial
                    </Link>
                    <a href="#how-it-works" className="px-8 py-4 rounded-full glass text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 border border-white/10">
                        <span className="material-symbols-rounded">science</span>
                        Test the AI
                    </a>
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
                </div>
            </div>
            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center border border-white/20">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-[60vh] object-cover bg-black"
                        ></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        
                        <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
                            <button 
                                onClick={stopCamera}
                                className="px-6 py-2 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            
                            <button 
                                onClick={takeSnapshot}
                                className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-gray-300 hover:scale-105 transition-transform"
                                title="Take Photo"
                            >
                                <div className="w-12 h-12 rounded-full border-2 border-black"></div>
                            </button>
                            
                            <div className="w-20"></div> {/* Spacer for centering */}
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* How It Works (Now includes the Interactive AI Demo) */}
        <section id="how-it-works" className="py-24 relative z-10 bg-slate-900/30 border-y border-white/5">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">How It Works <span className="text-gradient">(Try it yourself!)</span></h2>
                    <p className="text-slate-400 text-lg max-w-[672px] mx-auto font-sans">Upload a real receipt below. We won't save it, but our AI will instantly read and organize it for you.</p>
                </div>

                <div className="glass-panel rounded-3xl border border-white/10 p-6 md:p-10 shadow-2xl mb-12">
                    {!demoPreview && !demoLoading && (
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'}`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span className="material-symbols-rounded text-5xl text-slate-400 mb-4 block">cloud_upload</span>
                            <h3 className="text-xl font-semibold text-white mb-2">Drag and drop a receipt image</h3>
                            <p className="text-slate-400 mb-6 text-sm">Supports JPG, PNG, WEBP (Max 4MB)</p>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileChange(e.target.files[0]);
                                    }
                                }}
                            />
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); startCamera(); }}
                                    className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-rounded text-[20px]">photo_camera</span>
                                    Take Photo
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-rounded text-[20px]">folder</span>
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    )}

                    {demoLoading && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <span className="material-symbols-rounded text-6xl text-brand-500 animate-spin mb-6">progress_activity</span>
                            <h3 className="text-2xl font-bold text-white mb-2">Analyzing Receipt...</h3>
                            <p className="text-slate-400">Gemini AI is reading every line item and categorizing your expenses.</p>
                        </div>
                    )}

                    {demoError && (
                        <div className="py-12 text-center">
                            <span className="material-symbols-rounded text-5xl text-red-400 mb-4 block">error</span>
                            <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
                            <p className="text-red-400 mb-6">{demoError}</p>
                            <button 
                                onClick={() => { setDemoError(null); setDemoPreview(null); }}
                                className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {demoResult && demoPreview && !demoLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Original Image */}
                            <div className="flex flex-col">
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                    Original Receipt
                                    <button 
                                        onClick={() => { setDemoResult(null); setDemoPreview(null); }}
                                        className="text-brand-400 text-xs hover:underline normal-case"
                                    >
                                        Upload Another
                                    </button>
                                </h4>
                                <div className="bg-black/50 rounded-xl overflow-hidden border border-white/5 flex-1 relative min-h-[400px]">
                                    <img src={demoPreview} alt="Receipt Preview" className="absolute inset-0 w-full h-full object-contain p-4" />
                                </div>
                            </div>

                            {/* Extracted Data */}
                            <div className="flex flex-col">
                                <h4 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[18px]">auto_awesome</span>
                                    AI Extraction Results
                                </h4>
                                <div className="glass rounded-xl p-6 border border-brand-500/20 flex-1 overflow-y-auto max-h-[500px]">
                                    
                                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10">
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Merchant</p>
                                            <p className="text-2xl font-bold text-white">{demoResult.receipt?.merchant}</p>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                                <span className="material-symbols-rounded text-[16px]">calendar_today</span>
                                                {demoResult.receipt?.date || 'Unknown Date'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-400 mb-1">Total</p>
                                            <p className="text-3xl font-display font-bold text-green-400">
                                                {Number(demoResult.receipt?.total || 0).toFixed(2)} <span className="text-lg">{demoResult.receipt?.currency}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-sm font-medium text-slate-300 mb-3">Line Items ({demoResult.receipt?.items?.length || 0})</p>
                                        <div className="space-y-3">
                                            {demoResult.receipt?.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center border border-white/5">
                                                    <div>
                                                        <p className="font-medium text-slate-200">{item.name}</p>
                                                        <p className="text-xs text-brand-300">{item.itemCategory}</p>
                                                    </div>
                                                    <p className="font-semibold text-white">{Number(item.amount || 0).toFixed(2)}</p>
                                                </div>
                                            ))}
                                            {(!demoResult.receipt?.items || demoResult.receipt?.items.length === 0) && (
                                                <p className="text-sm text-slate-500 italic">No line items detected.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <p className="text-sm text-slate-400 mb-2">Primary Category: <strong className="text-white">{demoResult.receipt?.receiptCategory}</strong></p>
                                        <p className="text-sm text-slate-400 mb-2">Tax Amount: <strong className="text-white">{demoResult.receipt?.taxAmount}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workflow Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8 border-t border-white/5">
                    <div>
                        <div className="w-12 h-12 rounded-full bg-brand-500/20 mx-auto flex items-center justify-center border border-brand-500/30 text-brand-400 mb-4">
                            <span className="material-symbols-rounded">cloud_upload</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">1. Snap & Upload</h4>
                        <p className="text-sm text-slate-400">Take a photo in any language or currency. No manual entry needed.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto flex items-center justify-center border border-blue-500/30 text-blue-400 mb-4">
                            <span className="material-symbols-rounded">psychology</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">2. AI Parsing</h4>
                        <p className="text-sm text-slate-400">Our Gemini model extracts line items, totals, dates, and assigns categories.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 mx-auto flex items-center justify-center border border-purple-500/30 text-purple-400 mb-4">
                            <span className="material-symbols-rounded">monitoring</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">3. Track & Save</h4>
                        <p className="text-sm text-slate-400">Everything syncs to your dashboard to give you real-time financial insights.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Live Demo / Product Tour (Features) */}
        <section id="demo" className="py-24 relative z-10">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">Interactive Product Tour</h2>
                    <p className="text-slate-400 text-lg max-w-[672px] mx-auto font-sans">Once your receipts are scanned, Lekha Tracker provides a powerful dashboard to analyze your spending.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Tab selectors */}
                    <div className="flex flex-col gap-3 lg:w-1/3">
                        {features.map((feature, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveFeature(idx)}
                                className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                                    activeFeature === idx 
                                    ? 'bg-slate-800 border-white/20 shadow-xl scale-[1.02]' 
                                    : 'glass border-white/5 hover:bg-slate-800/50 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feature.bgColor} ${feature.borderColor}`}>
                                        <span className={`material-symbols-rounded ${feature.color}`}>{feature.icon}</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg">{feature.title}</h3>
                                </div>
                                <p className={`text-sm transition-colors duration-300 ${activeFeature === idx ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {feature.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Right: Mock UI Preview Panel */}
                    <div className="lg:w-2/3 glass-panel rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                        {/* Background subtle glow based on active feature */}
                        <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl opacity-30 rounded-full transition-colors duration-700 ${features[activeFeature].bgColor.replace('/20', '/40')}`}></div>
                        
                        <div className="relative z-10 w-full animate-fade-in" key={activeFeature}>
                            {features[activeFeature].mockUi}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 relative z-10 bg-slate-900/30 border-t border-white/5">
            <div className="max-w-[800px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { q: "Is my financial data secure?", a: "Yes. We use industry-standard encryption. Your receipts are parsed via secure API and stored safely. Passwords are never saved in plain text, and we support Google SSO for added security." },
                        { q: "Can it read handwritten receipts?", a: "Our Gemini AI model is incredibly powerful and can read many handwritten receipts with high accuracy, though clearly printed receipts will always yield the best results." },
                        { q: "What currencies are supported?", a: "The AI recognizes almost any currency symbol globally. The dashboard currently supports live conversion for major currencies like USD, EUR, GBP, and SEK, which you can set in your settings." },
                        { q: "Do I need to categorize items myself?", a: "No! The AI automatically assigns a primary category for the receipt (e.g. Groceries) and specific sub-categories for every single line item (e.g. Dairy, Produce)." }
                    ].map((faq, i) => (
                        <div key={i} className="glass-panel border border-white/10 rounded-xl overflow-hidden transition-all duration-300">
                            <button 
                                onClick={() => toggleFaq(i)}
                                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-white text-lg">{faq.q}</span>
                                <span className={`material-symbols-rounded text-brand-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                            <div 
                                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 py-4 border-t border-white/10' : 'max-h-0 py-0'}`}
                            >
                                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                            </div>
                        </div>
                    ))}
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
