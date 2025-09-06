'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Info, TrendingUp, Droplets } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OrbitalSpinner } from '@/components/ui/LoadingSpinner'
import { TOKENS, POOL_CONFIG } from '@/lib/constants'
import { useOrbitalAMM } from '@/hooks/useOrbitalAMM'
import { useWallet } from '@/hooks/useWallet'
import { formatNumber, formatCurrency } from '@/lib/utils'

export function LiquidityInterface() {
  const [kValue, setKValue] = useState<string>(POOL_CONFIG.demoK)
  const [amounts, setAmounts] = useState(
    new Array(5).fill('1000') // 1000 tokens each for demo
  )

  const { isConnected, connectWallet } = useWallet()
  const {
    addLiquidityDemo,
    addLiquidity,
    totalReserves,
    approveToken,
    checkAllowance,
    isLoading,
    error,
    isSuccess
  } = useOrbitalAMM()

  // Check if we need approvals for all tokens
  const tokenApprovals = TOKENS.map(token => checkAllowance(token.address))
  const needsApprovals = tokenApprovals.some((approval, index) => {
    const amount = amounts[index]
    if (!amount || !approval.data) return true
    return BigInt(approval.data) < BigInt(parseFloat(amount) * 1e18)
  })

  const totalLiquidityValue = useMemo(() => {
    if (!totalReserves) return 0
    // Mock USD value calculation - in reality would use price feeds
    return totalReserves.reduce((total, reserve) => {
      return total + parseFloat(reserve.reserveFormatted)
    }, 0)
  }, [totalReserves])

  const handleApproveAll = async () => {
    try {
      for (let i = 0; i < TOKENS.length; i++) {
        const approval = tokenApprovals[i]
        const amount = amounts[i]
        if (amount && approval.data && BigInt(approval.data) < BigInt(parseFloat(amount) * 1e18)) {
          await approveToken(TOKENS[i].address, amount)
        }
      }
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  const handleAddLiquidityDemo = async () => {
    try {
      await addLiquidityDemo()
    } catch (err) {
      console.error('Add liquidity failed:', err)
    }
  }

  const handleAddLiquidity = async () => {
    try {
      await addLiquidity(kValue, amounts)
    } catch (err) {
      console.error('Add liquidity failed:', err)
    }
  }

  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...amounts]
    newAmounts[index] = value
    setAmounts(newAmounts)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-orange-300 font-mono mb-2">
          LIQUIDITY MANAGEMENT
        </h2>
        <p className="text-orange-300/70 font-mono text-sm">
          Provide liquidity to the Orbital AMM
        </p>
      </motion.div>

      {/* Total Liquidity Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-300 font-mono">
                Total Pool Liquidity
              </h3>
              <p className="text-orange-300/70 text-sm font-mono">
                Current reserves across all tokens
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalLiquidityValue)}
            </div>
            <div className="text-sm text-orange-300/70 font-mono">
              USD Value
            </div>
          </div>
        </div>

        {/* Token Reserves */}
        {totalReserves && (
          <div className="mt-6 grid grid-cols-5 gap-4">
            {totalReserves.map((reserve, index) => (
              <div key={index} className="glass-morphism rounded-xl p-3 border border-orange-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: reserve.token.color }}
                  />
                  <span className="text-sm font-bold text-orange-300 font-mono">
                    {reserve.token.symbol}
                  </span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {reserve.reserveFormatted}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Liquidity Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <h3 className="text-xl font-bold text-orange-300 font-mono mb-6">
          Add Liquidity
        </h3>

        {/* K Value Input */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-orange-300 mb-2 font-mono">
            K Value (Tick Identifier)
          </label>
          <Input
            type="text"
            value={kValue}
            onChange={(e) => setKValue(e.target.value)}
            placeholder="Enter K value"
            className="font-mono"
          />
          <p className="text-xs text-orange-300/70 font-mono mt-1">
            Demo K value: {POOL_CONFIG.demoK}
          </p>
        </div>

        {/* Token Amount Inputs */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-bold text-orange-300 font-mono">
            Token Amounts
          </label>
          {TOKENS.map((token, index) => (
            <div key={index} className="glass-morphism rounded-xl p-4 border border-orange-500/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: token.color }}
                  />
                  <span className="font-bold text-orange-300 font-mono">
                    {token.symbol}
                  </span>
                </div>
                <Input
                  type="number"
                  value={amounts[index]}
                  onChange={(e) => updateAmount(index, e.target.value)}
                  placeholder="0.0"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isConnected ? (
            <Button
              onClick={connectWallet}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-mono"
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              {/* Demo Button */}
              <Button
                onClick={handleAddLiquidityDemo}
                disabled={isLoading}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-mono"
              >
                {isLoading ? (
                  <>
                    <OrbitalSpinner size="sm" />
                    Adding Demo Liquidity...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Demo Liquidity (1000 tokens each)
                  </>
                )}
              </Button>

              {/* Custom Liquidity Button */}
              {needsApprovals ? (
                <Button
                  onClick={handleApproveAll}
                  disabled={isLoading}
                  className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-mono"
                >
                  {isLoading ? (
                    <>
                      <OrbitalSpinner size="sm" />
                      Approving Tokens...
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 mr-2" />
                      Approve All Tokens
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleAddLiquidity}
                  disabled={isLoading || !amounts.some(a => parseFloat(a) > 0)}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-mono"
                >
                  {isLoading ? (
                    <>
                      <OrbitalSpinner size="sm" />
                      Adding Liquidity...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Liquidity
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-300 text-sm font-mono">
              Error: {error.message}
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl">
            <p className="text-green-300 text-sm font-mono">
              Liquidity added successfully!
            </p>
          </div>
        )}
      </motion.div>

      {/* Information Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-orange-300" />
          <h3 className="text-lg font-bold text-orange-300 font-mono">
            Demo Information
          </h3>
        </div>
        <div className="space-y-2 text-sm text-orange-300/70 font-mono">
          <p>• Demo K value: {POOL_CONFIG.demoK}</p>
          <p>• Demo amount per token: 1000 tokens</p>
          <p>• All tokens have 18 decimals</p>
          <p>• Make sure you have sufficient token balances</p>
          <p>• Approve tokens before adding liquidity</p>
        </div>
      </motion.div>
    </div>
  )
}