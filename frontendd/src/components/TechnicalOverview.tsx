'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Network, 
  Shield, 
  Zap, 
  Cpu,
  Users
} from 'lucide-react';

const TechnicalOverview: React.FC = () => {
  const advantages = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Spherical Invariant",
      description: "K = ||r||² maintains constant sum of squared reserves across all trades",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Vector Mathematics",
      description: "Reserves treated as n-dimensional vectors with precise geometric calculations",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Tick Classification",
      description: "Interior/Boundary classification enables concentrated liquidity positions",
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Gas Optimization",
      description: "Integer arithmetic and Newton's method minimize computational costs",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const technicalSpecs = [
    {
      category: "Protocol",
      specs: [
        { label: "Invariant Formula", value: "K = ||r||² = Σ(xᵢ²)" },
        { label: "Square Root Method", value: "Newton's Method" },
        { label: "Precision", value: "10¹⁸ (18 decimals)" },
        { label: "Gas Estimation", value: "80K + 15K×complexity" }
      ]
    },
    {
      category: "Performance",
      specs: [
        { label: "Max Efficiency", value: "1000x Capital" },
        { label: "Supported Tokens", value: "n-dimensional" },
        { label: "Tick Boundaries", value: "Spherical Caps" },
        { label: "Liquidity Concentration", value: "Customizable Ranges" }
      ]
    },
    {
      category: "Security",
      specs: [
        { label: "Mathematical Proofs", value: "Formal Verification" },
        { label: "Slippage Protection", value: "Minimal via Precision" },
        { label: "Depeg Resistance", value: "Boundary Tick Safety" },
        { label: "Reserve Bounds", value: "0 ≤ xᵢ ≤ r for all i" }
      ]
    }
  ];

  // const processFlow = [
  //   { step: 1, title: "Reserve Vector", description: "Calculate current reserves as n-dimensional vector r⃗ = (x₁, x₂, ..., xₙ)", icon: <Key className="w-6 h-6" /> },
  //   { step: 2, title: "K Constant", description: "Compute spherical invariant K = ||r||² = x₁² + x₂² + ... + xₙ²", icon: <TrendingUp className="w-6 h-6" /> },
  //   { step: 3, title: "Trade Calculation", description: "Solve for output: (rᵢₙ + Δᵢₙ)² + (rₒᵤₜ - Δₒᵤₜ)² + Σ(rⱼ²) = K", icon: <Lock className="w-6 h-6" /> },
  //   { step: 4, title: "Integer Sqrt", description: "Use Newton's method for precise integer square root calculation", icon: <Eye className="w-6 h-6" /> },
  //   { step: 5, title: "Price Impact", description: "Calculate price impact and ensure optimal execution", icon: <CheckCircle className="w-6 h-6" /> }
  // ];

  // const riskMitigations = [
  //   {
  //     risk: "Resolver Default",
  //     mitigation: "Time-locked recovery mechanisms",
  //     icon: <Clock className="w-5 h-5" />
  //   },
  //   {
  //     risk: "Secret Exposure",
  //     mitigation: "One-time cryptographic commitments",
  //     icon: <Shield className="w-5 h-5" />
  //   },
  //   {
  //     risk: "Network Congestion",
  //     mitigation: "Multi-chain routing and fallbacks",
  //     icon: <Network className="w-5 h-5" />
  //   },
  //   {
  //     risk: "Price Manipulation",
  //     mitigation: "Competitive Dutch auction pricing",
  //     icon: <TrendingUp className="w-5 h-5" />
  //   }
  // ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8 ">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4 bg-white bg-clip-text text-transparent font-[family-name:var(--font-unbounded)]">
          Benchmarks
        </h2>
        <p className="text-lg text-neutral-300 max-w-3xl mx-auto font-[family-name:var(--font-spline-sans-mono)]">
          Why us over popular market capturers?  
          {/* <span className="text-blue-400 font-semibold"> automated market makers</span> */}
        </p>
      </div>

      {/* Key Advantages */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {advantages.slice(0, 4).map((advantage, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full text-center hover:scale-105 transition-transform duration-300 bg-black/80 border-neutral-800/50">
              <CardHeader>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${advantage.color} flex items-center justify-center shadow-lg text-black`}>
                  {advantage.icon}
                </div>
                <CardTitle className="text-base text-white font-[family-name:var(--font-unbounded)]">
                  {advantage.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300 text-xs leading-relaxed font-[family-name:var(--font-spline-sans-mono)]">
                  {advantage.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Technical Specifications */}
      <Card className="bg-black/80 border-neutral-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white text-lg font-[family-name:var(--font-unbounded)]">
            <Cpu className="w-5 h-5 mr-2 text-blue-400" />
            Technical Specifications
          </CardTitle>
          <CardDescription className="text-neutral-300 text-sm font-[family-name:var(--font-spline-sans-mono)]">
            Key technical parameters and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="protocol" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="protocol" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 text-sm">Protocol</TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 text-sm">Performance</TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 text-sm">Security</TabsTrigger>
            </TabsList>
            
            {technicalSpecs.map((category) => (
              <TabsContent key={category.category.toLowerCase()} value={category.category.toLowerCase()}>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {category.specs.map((spec, index) => (
                    <motion.div
                      key={spec.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-3 bg-neutral-900/50 rounded-lg border border-neutral-800/50 hover:border-blue-500/30 transition-colors duration-300"
                    >
                      <span className="text-neutral-300 font-medium text-sm font-[family-name:var(--font-spline-sans-mono)]">{spec.label}</span>
                      <span className="text-white font-semibold text-sm font-[family-name:var(--font-spline-sans-mono)]">{spec.value}</span>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Process Flow Diagram */}
      
    </div>
  );
};

export default TechnicalOverview; 