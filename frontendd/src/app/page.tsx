'use client'
import React from 'react';
import Navigation from '@/components/Navigation';
import FusionTimeline from '@/components/FusionTimeline';
import TechnicalOverview from '@/components/TechnicalOverview';
import InteractiveDemo from '@/components/InteractiveDemo';
import { Zap, Globe, Shield, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

const NetworkBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Static background for non-hero sections */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black" />
      <div className="mesh-gradient-1 absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
};

const HeroVideoBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Video Background with margin from top */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-[1%] left-0 h-[99%] w-[100%] object-cover opacity-98"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Existing gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-neutral-950/10 to-black/30" />
      <div className="mesh-gradient-1 absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
};

const UniteDefiLanding = () => {
  const stats = [
    { label: 'Stablecoins Supported', value: '1000+', color: 'from-blue-400 to-cyan-400' },
    { label: 'AMM Innovation', value: 'Spherical', color: 'from-cyan-400 to-blue-500' },
    { label: 'More Efficient than Uniswap and Curve', value: 'Multiple Times', color: 'from-blue-500 to-cyan-500' },
    { label: 'Invariant', value: 'K = ||r||²', color: 'from-cyan-300 to-blue-400' }
  ];

  const features = [
    {
      icon: <Globe className="w-10 h-10" />,
      title: 'Spherical Geometry',
      description: 'Uses spherical invariant where, enabling optimal capital efficiency.',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Concentrated Liquidity',
      description: 'Interior and Boundary tick classification allows for concentrated liquidity positions with up to 1000x capital efficiency.',
      gradient: 'from-cyan-500 via-blue-600 to-cyan-600',
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'Mathematical Precision',
      description: 'Integer square root calculations and normalized reserve vectors ensure precise trading with minimal slippage.',
      gradient: 'from-blue-600 via-cyan-500 to-blue-700',
    }
  ];

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      <NetworkBackground />
      
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-12 min-h-[90vh] flex flex-col justify-center">
        <HeroVideoBackground />
        <div className="max-w-7xl mx-auto w-full relative flex flex-col items-center justify-center min-h-[80vh]">
          
          {/* Hero Title - Moved up and centered */}
          <div className="text-center mb-12 mt-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                ORBITAL
              </span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-500 hover:brightness-125 cursor-pointer ml-4" style={{display: 'inline-block'}}>
                AMM
              </span>
              <span className="bg-gradient-to-r from-white via-neutral-100 to-white bg-clip-text text-transparent"> Protocol</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Revolutionary Stablecoin AMM using spherical geometry and orbital mechanics. Trade with optimal capital efficiency through mathematical innovation.
            </p>
          </div>

          {/* Stats Grid - Centered below title */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="group text-center p-4 md:p-6 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-2xl hover:bg-neutral-900/50 hover:border-neutral-700/60 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <div className={`text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300 font-[family-name:var(--font-unbounded)]`}>
                    {stat.value}
                  </div>
                  <div className="text-neutral-400 text-xs md:text-sm font-medium group-hover:text-neutral-300 transition-colors duration-300 font-[family-name:var(--font-spline-sans-mono)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Down Arrow - Centered at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <a href="#features" aria-label="Scroll to features" className="animate-bounce cursor-pointer group">
            <div className="p-3 bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/50 rounded-full group-hover:bg-neutral-900/50 transition-all duration-300">
              <ChevronDown className="w-6 h-6 text-blue-400 group-hover:text-cyan-300" />
            </div>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="mesh-gradient-2 absolute inset-0 opacity-30"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-white via-neutral-100 to-white bg-clip-text text-transparent font-[family-name:var(--font-unbounded)]">
              Spherical Innovation
            </h2>
            <p className="text-lg text-neutral-400 max-w-3xl mx-auto font-light font-[family-name:var(--font-spline-sans-mono)]">
              Built with advanced mathematics for the next generation of <span className="text-blue-400 font-semibold">automated market makers</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group cursor-pointer">
                <Card className="h-full hover:scale-105 transition-transform duration-500">                  
                  <CardHeader>
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-blue-500/20`}>
                      {feature.icon}
                    </div>
                    
                    <CardTitle className="text-xl mb-4 bg-gradient-to-r from-white to-neutral-200 bg-clip-text text-transparent group-hover:from-cyan-200 group-hover:to-white transition-all duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-neutral-400 leading-relaxed text-sm group-hover:text-neutral-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="relative z-10 px-6 py-32">
        <div className="mesh-gradient-1 absolute inset-0 opacity-30"></div>
        <div className="relative">
          <InteractiveDemo />
        </div>
      </section>

      {/* How It Works Section - NEW COLOR THEME */}
      <section id="how-it-works" className="relative z-10 py-32 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-cyan-900/5 to-blue-900/10"></div>
        <div className="relative">
          <FusionTimeline />
        </div>
      </section>

      {/* Technical Deep Dive - NEW COLOR THEME */}
      <section id="technical" className="relative z-10 px-6 py-32 bg-gradient-to-br from-black via-blue-950/20 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-cyan-900/5 to-blue-900/10 opacity-50"></div>
        <div className="relative">
          <TechnicalOverview />
        </div>
      </section>

      {/* API Integration Section */}
      <section id="api" className="relative z-10 px-6 py-32 bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-cyan-900/5 to-blue-900/5 opacity-30"></div>
        <div className="max-w-7xl mx-auto relative">
          
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Developer API
              </h2>
            </div>
            <p className="text-xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              Build on top of Orbital AMM with our simple, powerful REST API. No complex SDKs needed - just straightforward HTTP requests that work with any programming language.
            </p>
          </div>

          {/* What is an API? - Simple Explanation */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-3 text-cyan-300">
                  <Globe className="w-6 h-6" />
                  <span>What is an API? (In Plain English)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white">Think of it like a restaurant menu</h3>
                    <p className="text-neutral-300 leading-relaxed mb-4">
                      When you go to a restaurant, you don't walk into the kitchen to cook your own food. Instead, you look at the menu, 
                      tell the waiter what you want, and they bring it to you. An API works the same way.
                    </p>
                    <p className="text-neutral-300 leading-relaxed">
                      Our API is like a digital menu for the Orbital AMM. You send us a request saying "I want to swap 100 tokens" 
                      and we send back the exact instructions your app needs to make that happen.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white">Why use our API?</h3>
                    <ul className="space-y-3 text-neutral-300">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span><strong>No complex math:</strong> We handle all the spherical geometry calculations for you</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span><strong>Works everywhere:</strong> Use any programming language - Python, JavaScript, Go, whatever</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span><strong>Real-time data:</strong> Get live prices, gas estimates, and pool information instantly</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span><strong>Battle-tested:</strong> Every endpoint works with simple cURL commands</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How APIs Work - Step by Step */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center text-white">How It Works (Step by Step)</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-neutral-900/30 border-neutral-800 group hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-4 text-cyan-300">You Send a Request</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Your app sends us a simple message like "I want to swap 100 MUSDC-A for MUSDC-B" 
                    using a standard HTTP request (like visiting a website).
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900/30 border-neutral-800 group hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-4 text-cyan-300">We Do the Math</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Our servers calculate the exact amount you'll receive using our spherical invariant formula, 
                    check gas prices, and prepare the transaction data.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900/30 border-neutral-800 group hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-4 text-cyan-300">You Get Instructions</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    We send back everything your app needs: transaction data, gas estimates, 
                    and confirmation that everything is ready to go.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* API Capabilities */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center text-white">What You Can Build</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Trading Bots",
                  description: "Create automated trading strategies that execute swaps based on market conditions, price movements, or custom algorithms.",
                  icon: "🤖",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  title: "Portfolio Managers",
                  description: "Build tools that help users manage their token portfolios, rebalance automatically, and track performance across multiple tokens.",
                  icon: "📊",
                  color: "from-cyan-500 to-blue-500"
                },
                {
                  title: "Analytics Dashboards",
                  description: "Create real-time dashboards showing trading volume, liquidity changes, price charts, and protocol statistics.",
                  icon: "📈",
                  color: "from-blue-600 to-cyan-600"
                },
                {
                  title: "Mobile Apps",
                  description: "Develop mobile applications that let users trade, add liquidity, and monitor their positions on the go.",
                  icon: "📱",
                  color: "from-cyan-600 to-blue-600"
                },
                {
                  title: "DeFi Aggregators",
                  description: "Integrate Orbital AMM into larger DeFi platforms that compare prices across multiple exchanges and find the best deals.",
                  icon: "🔍",
                  color: "from-blue-700 to-cyan-700"
                },
                {
                  title: "Educational Tools",
                  description: "Build learning platforms that teach users about AMMs, liquidity provision, and DeFi concepts through interactive examples.",
                  icon: "🎓",
                  color: "from-cyan-700 to-blue-700"
                }
              ].map((capability, index) => (
                <Card key={index} className="bg-neutral-900/20 border-neutral-800 group hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${capability.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {capability.icon}
                      </div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">
                        {capability.title}
                      </h4>
                    </div>
                    <p className="text-neutral-300 leading-relaxed text-sm">
                      {capability.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed API Examples */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center text-white">Complete API Reference (Simple Explanations)</h3>
            <div className="space-y-8">
              <Card className="bg-neutral-900/30 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</span>
                    <span>Health Check - Is Everything Working?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">curl http://localhost:8000/health</code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What it does:</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        This is like checking if a restaurant is open before you go there. It tells you if our API is running, 
                        what network it's connected to, and gives you the pool address. Always run this first!
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What you get back:</h4>
                      <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-300">
                        {`{
  "status": "healthy",
  "pool_address": "0x83EC...",
  "network": "Arbitrum Sepolia",
  "chain_id": 421614
}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900/30 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">📋</span>
                    <span>Get All Available Tokens</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">curl http://localhost:8000/tokens</code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What it does:</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed">
                        Think of this as getting a menu of all available dishes. It shows you all 5 tokens (MUSDC-A through MUSDC-E) 
                        that you can trade, along with their addresses. You need this before you can do any swaps.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What you get back:</h4>
                      <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-300">
                        {`{
  "tokens": {
    "0": {"address": "0x9666...", "symbol": "MUSDC-A"},
    "1": {"address": "0x1921...", "symbol": "MUSDC-B"},
    "2": {"address": "0x...", "symbol": "MUSDC-C"},
    "3": {"address": "0x...", "symbol": "MUSDC-D"},
    "4": {"address": "0x...", "symbol": "MUSDC-E"}
  }
}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900/30 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">🔄</span>
                    <span>Swap Tokens (The Main Event)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">
                      curl -X POST http://localhost:8000/swap \<br/>
                      &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br/>
                      &nbsp;&nbsp;-d &apos;{`{"token_in_index": 0, "token_out_index": 1, "amount_in": "1000000000000000000", "min_amount_out": "0", "user_address": "0xYourAddress"}`}&apos;
                    </code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What it does:</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                        This is like ordering food at a restaurant. You tell us: "I want to trade 1 MUSDC-A for MUSDC-B" 
                        and we calculate exactly how much MUSDC-B you'll get, plus all the transaction details.
                      </p>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                        <p className="text-blue-300 text-xs font-semibold mb-1">Parameters explained:</p>
                        <ul className="text-neutral-300 text-xs space-y-1">
                          <li>• <strong>token_in_index:</strong> Which token you're giving (0 = MUSDC-A)</li>
                          <li>• <strong>token_out_index:</strong> Which token you want (1 = MUSDC-B)</li>
                          <li>• <strong>amount_in:</strong> How much you're trading (in wei)</li>
                          <li>• <strong>min_amount_out:</strong> Minimum you'll accept (0 = any amount)</li>
                          <li>• <strong>user_address:</strong> Your wallet address</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What you get back:</h4>
                      <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-300">
                        {`{
  "success": true,
  "transaction_data": {
    "to": "0x83EC...",
    "data": "0x5673b02d...",
    "gas": 300000,
    "gasPrice": "100000000",
    "chainId": 421614
  },
  "gas_estimate": 300000
}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Liquidity */}
              <Card className="bg-neutral-900/30 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">💧</span>
                    <span>Add Liquidity (Become a Market Maker)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">
                      curl -X POST http://localhost:8000/liquidity/add \<br/>
                      &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br/>
                      &nbsp;&nbsp;-d &apos;{`{"k_value": 1000, "amounts": ["1000000000000000000", "1000000000000000000", "1000000000000000000", "1000000000000000000", "1000000000000000000"], "user_address": "0xYourAddress"}`}&apos;
                    </code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What it does:</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                        This is like opening a food stall in a market. You provide all 5 tokens in equal amounts, 
                        and you earn fees when people trade through your liquidity. The k_value determines how concentrated your position is.
                      </p>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                        <p className="text-purple-300 text-xs font-semibold mb-1">Key concepts:</p>
                        <ul className="text-neutral-300 text-xs space-y-1">
                          <li>• <strong>k_value:</strong> Higher = more concentrated liquidity = more fees</li>
                          <li>• <strong>amounts:</strong> How much of each token you're adding</li>
                          <li>• <strong>LP shares:</strong> You get tokens representing your share of the pool</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What you get back:</h4>
                      <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-300">
                        {`{
  "success": true,
  "transaction_data": {
    "to": "0x83EC...",
    "data": "0xd3fbf29e...",
    "gas": 300000
  },
  "k_value": "1000",
  "lp_shares": "500000000000000000"
}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gas Price */}
              <Card className="bg-neutral-900/30 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">⛽</span>
                    <span>Check Gas Prices (Transaction Costs)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">curl http://localhost:8000/gas-price</code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What it does:</h4>
                      <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                        This is like checking gas prices before you fill up your car. It tells you how much it will cost 
                        to execute transactions on the blockchain right now. Gas prices change based on network congestion.
                      </p>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                        <p className="text-yellow-300 text-xs font-semibold mb-1">Gas explained:</p>
                        <ul className="text-neutral-300 text-xs space-y-1">
                          <li>• <strong>Gas:</strong> Fee paid to miners for processing your transaction</li>
                          <li>• <strong>Gwei:</strong> Smaller unit of gas (1 ETH = 1,000,000,000 Gwei)</li>
                          <li>• <strong>Higher gas:</strong> Faster transaction, more expensive</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">What you get back:</h4>
                      <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-300">
                        {`{
  "gas_price": "100000000",
  "gas_price_gwei": "0.1",
  "network_congestion": "low"
}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Overview */}
              <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-300 flex items-center space-x-3">
                    <span className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">📊</span>
                    <span>Analytics & Data (The Intelligence Layer)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    These endpoints give you insights into what's happening in the protocol. Perfect for building dashboards, 
                    tracking performance, and understanding market behavior.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-neutral-800/50 rounded p-4">
                        <h4 className="font-semibold mb-2 text-cyan-300">Protocol Statistics</h4>
                        <code className="text-green-400 text-xs">GET /analytics/stats</code>
                        <p className="text-neutral-300 text-xs mt-2">
                          Get total value locked, trading volume, number of swaps, and other key metrics. 
                          Like getting a business report for the entire protocol.
                        </p>
                      </div>
                      
                      <div className="bg-neutral-800/50 rounded p-4">
                        <h4 className="font-semibold mb-2 text-cyan-300">Recent Swaps</h4>
                        <code className="text-green-400 text-xs">GET /analytics/swaps?limit=10</code>
                        <p className="text-neutral-300 text-xs mt-2">
                          See the latest trading activity. Great for building activity feeds, 
                          tracking popular trading pairs, or monitoring suspicious activity.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-neutral-800/50 rounded p-4">
                        <h4 className="font-semibold mb-2 text-cyan-300">Token Analytics</h4>
                        <code className="text-green-400 text-xs">GET /analytics/token/0</code>
                        <p className="text-neutral-300 text-xs mt-2">
                          Deep dive into a specific token's performance: price history, volume, 
                          liquidity changes. Essential for token analysis tools.
                        </p>
                      </div>
                      
                      <div className="bg-neutral-800/50 rounded p-4">
                        <h4 className="font-semibold mb-2 text-cyan-300">User Activity</h4>
                        <code className="text-green-400 text-xs">GET /analytics/user/0x...</code>
                        <p className="text-neutral-300 text-xs mt-2">
                          Track a specific user's trading history, portfolio value, 
                          and activity patterns. Useful for portfolio trackers and user dashboards.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Why Our API is Different */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-cyan-300">Why Our API is Different</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-white">Traditional AMM APIs</h4>
                    <ul className="space-y-2 text-neutral-300">
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">✗</span>
                        <span>Require complex SDKs and deep blockchain knowledge</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">✗</span>
                        <span>Only work with specific programming languages</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">✗</span>
                        <span>Limited to basic swap operations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">✗</span>
                        <span>Poor documentation and examples</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-white">Orbital AMM API</h4>
                    <ul className="space-y-2 text-neutral-300">
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Works with any programming language - just HTTP requests</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Handles complex spherical math automatically</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Complete trading, liquidity, and analytics in one API</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Every endpoint tested with real cURL commands</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-6 text-white">Ready to Start Building?</h3>
            <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto">
              Our API is designed to be simple enough for beginners but powerful enough for advanced developers. 
              No complex setup, no confusing documentation - just straightforward requests that work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/api-docs" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105">
                View Complete API Docs
              </Link>
              <Link href="/swap" className="px-8 py-4 border border-blue-500/50 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/10 transition-all duration-300">
                Try the Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - NEW COLOR THEME */}
      <footer className="relative z-10 px-6 py-20 border-t border-blue-800/30 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-cyan-900/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                
                <span className="text-xl font-bold font-[family-name:var(--font-unbounded)] bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Orbital AMM
                </span>
              </div>
              <p className="text-neutral-300 leading-relaxed mb-6 max-w-md font-[family-name:var(--font-spline-sans-mono)]">
                The future of AMM infrastructure is here. Unlock superior capital efficiency with spherical geometry and orbital mechanics for next-generation DeFi.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 font-[family-name:var(--font-unbounded)]">Product</h4>
              <div className="space-y-3">
                {[
                  { name: 'Swap', href: '/swap' },
                  { name: 'Liquidity', href: '/add-liquidity' },
                  { name: 'Documentation', href: '/documentation' }
                ].map((item) => (
                  <Link key={item.name} href={item.href} className="block text-neutral-300 hover:text-blue-400 transition-colors duration-300 font-[family-name:var(--font-spline-sans-mono)]">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 font-[family-name:var(--font-unbounded)]">Resources</h4>
              <div className="space-y-3">
                {['Documentation', 'Tutorials', 'Blog', 'Support'].map((item) => (
                  <a key={item} href="#" className="block text-neutral-300 hover:text-blue-400 transition-colors duration-300 font-[family-name:var(--font-spline-sans-mono)]">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800/30 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-neutral-400 text-sm mb-4 md:mb-0 font-[family-name:var(--font-spline-sans-mono)]">
              © 2024 Orbital AMM. All rights reserved. Built for the future of finance.
            </p>
            <div className="flex space-x-6 text-sm">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <a key={item} href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 font-[family-name:var(--font-spline-sans-mono)]">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UniteDefiLanding;