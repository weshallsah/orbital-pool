'use client'
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Code, 
  Terminal, 
  Zap, 
  Database, 
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Activity,
  BarChart3,
  Users,
  TrendingUp
} from 'lucide-react';

const ApiDocsPage = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative bg-neutral-900 rounded-lg border border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span className="text-xs text-neutral-400 font-mono">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-blue-400 transition-colors"
        >
          {copiedCode === id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copiedCode === id ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-neutral-300">{code}</code>
      </pre>
    </div>
  );

  const EndpointCard = ({ 
    method, 
    endpoint, 
    description, 
    example, 
    response 
  }: { 
    method: string; 
    endpoint: string; 
    description: string; 
    example: string;
    response?: string;
  }) => (
    <Card className="bg-neutral-900/30 border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {method}
          </span>
          <code className="text-cyan-300 font-mono">{endpoint}</code>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-neutral-300">{description}</p>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-neutral-400">Example Request:</h4>
          <CodeBlock
            id={`${method}-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`}
            language="bash"
            code={example}
          />
        </div>
        {response && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-neutral-400">Example Response:</h4>
            <CodeBlock
              id={`${method}-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}-response`}
              language="json"
              code={response}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
              <Code className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Orbital Pool API
            </h1>
          </div>
          <p className="text-neutral-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Simple REST API for the Orbital Pool - a 5-token AMM on Arbitrum Sepolia. All endpoints tested and working with cURL commands.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Terminal className="w-6 h-6 text-blue-400" />
                <span>Quick Start</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Base URL</h3>
                <CodeBlock
                  id="base-url"
                  language="endpoint"
                  code="http://localhost:8000"
                />
                <p className="text-neutral-400 text-sm mt-2">No authentication needed - everything's public.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Test the API</h3>
                <CodeBlock
                  id="health-check"
                  language="bash"
                  code="curl http://localhost:8000/health"
                />
              </div>

              <div className="bg-neutral-800/30 rounded-lg p-6">
                <h4 className="font-semibold mb-3 text-cyan-300">What you can do:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-white">Trading:</strong>
                    <ul className="text-neutral-400 mt-1 space-y-1">
                      <li>• Swap tokens (any of the 5 for any other)</li>
                      <li>• Add liquidity to earn fees</li>
                      <li>• Remove liquidity when you want out</li>
                      <li>• Check gas prices</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">Analytics:</strong>
                    <ul className="text-neutral-400 mt-1 space-y-1">
                      <li>• See protocol stats (volume, TVL, etc.)</li>
                      <li>• Check recent swaps</li>
                      <li>• Get token data</li>
                      <li>• Track user activity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Core Endpoints */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
            <Zap className="w-8 h-8 text-orange-400" />
            <span>Core Endpoints</span>
          </h2>
          
          <div className="space-y-8">
            <EndpointCard
              method="GET"
              endpoint="/health"
              description="Check if everything's working."
              example="curl http://localhost:8000/health"
              response={`{
  "status": "healthy",
  "pool_address": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
  "network": "Arbitrum Sepolia",
  "chain_id": 421614
}`}
            />

            <EndpointCard
              method="GET"
              endpoint="/tokens"
              description="See what tokens are available (MUSDC-A through MUSDC-E)."
              example="curl http://localhost:8000/tokens"
              response={`{
  "tokens": {
    "0": {
      "address": "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
      "symbol": "MUSDC-A"
    },
    "1": {
      "address": "0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC",
      "symbol": "MUSDC-B"
    },
    "2": { "address": "0x...", "symbol": "MUSDC-C" },
    "3": { "address": "0x...", "symbol": "MUSDC-D" },
    "4": { "address": "0x...", "symbol": "MUSDC-E" }
  },
  "pool_address": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431"
}`}
            />

            <EndpointCard
              method="POST"
              endpoint="/swap"
              description="Generate transaction data for swapping tokens."
              example={`curl -X POST http://localhost:8000/swap \\
  -H "Content-Type: application/json" \\
  -d '{
    "token_in_index": 0,
    "token_out_index": 1,
    "amount_in": "1000000000000000000",
    "min_amount_out": "0",
    "user_address": "0xYourAddress"
  }'`}
              response={`{
  "success": true,
  "transaction_data": {
    "to": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
    "data": "0x5673b02d...",
    "gas": 300000,
    "gasPrice": "100000000",
    "chainId": 421614,
    "value": 0,
    "nonce": 0,
    "from": "0xYourAddress"
  },
  "gas_estimate": 300000,
  "gas_price": "100000000"
}`}
            />

            <EndpointCard
              method="POST"
              endpoint="/liquidity/add"
              description="Add liquidity to the pool with k-value."
              example={`curl -X POST http://localhost:8000/liquidity/add \\
  -H "Content-Type: application/json" \\
  -d '{
    "k_value": 1000,
    "amounts": [
      "1000000000000000000",
      "1000000000000000000", 
      "1000000000000000000",
      "1000000000000000000",
      "1000000000000000000"
    ],
    "user_address": "0xYourAddress"
  }'`}
              response={`{
  "success": true,
  "transaction_data": {
    "to": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
    "data": "0xd3fbf29e...",
    "gas": 300000,
    "gasPrice": "100000000",
    "chainId": 421614,
    "value": 0
  },
  "k_value": "1000",
  "amounts": [1000000000000000000, ...]
}`}
            />

            <EndpointCard
              method="POST"
              endpoint="/liquidity/remove"
              description="Remove liquidity from the pool."
              example={`curl -X POST http://localhost:8000/liquidity/remove \\
  -H "Content-Type: application/json" \\
  -d '{
    "k_value": 1000,
    "lp_shares": "500000000000000000",
    "user_address": "0xYourAddress"
  }'`}
            />

            <EndpointCard
              method="GET"
              endpoint="/gas-price"
              description="Get current gas price."
              example="curl http://localhost:8000/gas-price"
              response={`{
  "gas_price": "100000000",
  "gas_price_gwei": "0.1"
}`}
            />
          </div>
        </section>

        {/* Analytics Endpoints */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-orange-400" />
            <span>Analytics Endpoints</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[
              { 
                icon: Database, 
                endpoint: '/analytics/stats', 
                desc: 'Protocol statistics (TVL, volume, swaps)',
                example: 'curl http://localhost:8000/analytics/stats'
              },
              { 
                icon: Activity, 
                endpoint: '/analytics/swaps', 
                desc: 'Recent swap transactions with pagination',
                example: 'curl "http://localhost:8000/analytics/swaps?limit=5"'
              },
              { 
                icon: TrendingUp, 
                endpoint: '/analytics/token/{id}', 
                desc: 'Token-specific analytics and metrics',
                example: 'curl http://localhost:8000/analytics/token/0'
              },
              { 
                icon: Users, 
                endpoint: '/analytics/user/{address}', 
                desc: 'User trading statistics and history',
                example: 'curl http://localhost:8000/analytics/user/0x...'
              }
            ].map((item, index) => (
              <Card key={index} className="bg-neutral-900/20 border-neutral-800">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <code className="text-cyan-300 font-mono text-sm">{item.endpoint}</code>
                  </div>
                  <p className="text-neutral-400 text-sm mb-4">{item.desc}</p>
                  <CodeBlock
                    id={`analytics-${index}`}
                    language="bash"
                    code={item.example}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-neutral-800/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-cyan-300">Additional Analytics Endpoints</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <code className="text-cyan-300">/analytics/volume</code>
                <p className="text-neutral-400 mt-1">Daily volume data for charts</p>
              </div>
              <div>
                <code className="text-cyan-300">/analytics/top-tokens</code>
                <p className="text-neutral-400 mt-1">Top tokens by volume</p>
              </div>
              <div>
                <code className="text-cyan-300">/analytics/swap/{`{tx_hash}`}</code>
                <p className="text-neutral-400 mt-1">Swap details by transaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-16">
          <Card className="bg-blue-500/10 border border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-xl">Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-3 text-cyan-300">Network & Tokens</h4>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>Network:</strong> Arbitrum Sepolia (testnet, chain ID 421614)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>Pool:</strong> 0x83EC719A6F504583d0F88CEd111cB8e8c0956431</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>Tokens:</strong> MUSDC-A through MUSDC-E (5 test tokens)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-cyan-300">Usage Tips</h4>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>Amounts:</strong> All amounts must be in wei (18 decimals)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>Approvals:</strong> Ensure tokens are approved before swapping</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                      <span><strong>K-Values:</strong> Higher k-values = more concentrated liquidity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Command line functionality is essential - all endpoints tested with cURL commands.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
            <Button variant="outline" size="sm">
              <Code className="w-4 h-4 mr-2" />
              API Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
