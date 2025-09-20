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
    { label: 'More Efficient than Uniswap and Curve', value: '1000x', color: 'from-blue-500 to-cyan-500' },
    { label: 'Invariant', value: 'K = ||r||²', color: 'from-cyan-300 to-blue-400' }
  ];

  const features = [
    {
      icon: <Globe className="w-10 h-10" />,
      title: 'Spherical Geometry',
      description: 'Uses spherical invariant K = ||r||² where reserves form vectors in n-dimensional space, enabling optimal capital efficiency.',
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

      {/* Footer - NEW COLOR THEME */}
      <footer className="relative z-10 px-6 py-20 border-t border-blue-800/30 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-cyan-900/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Zap className="w-5 h-5 text-white" />
                </div>
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