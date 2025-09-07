'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, Settings, Info, Zap } from 'lucide-react'
import { TokenSelector } from '@/components/ui/TokenSelector'
import { TransactionResult } from '@/components/ui/TransactionResult'
import { TOKENS } from '@/lib/constants'
import { useOrbitalAMM } from '@/hooks/useOrbitalAMM'
import { useWallet } from '@/hooks/useWallet'
import { formatNumber } from '@/lib/utils'

export function SwapInterface() {
    const [tokenIn, setTokenIn] = useState<typeof TOKENS[number]>(TOKENS[0])
    const [tokenOut, setTokenOut] = useState<typeof TOKENS[number]>(TOKENS[1])
    const [amountIn, setAmountIn] = useState('')
    const [slippage, setSlippage] = useState(0.5)
    const [showSettings, setShowSettings] = useState(false)
    const [showTransactionResult, setShowTransactionResult] = useState(false)
    const [transactionDetails, setTransactionDetails] = useState<{
        hash: string
        amountIn: string
        amountOut: string
        tokenInSymbol: string
        tokenOutSymbol: string
    } | null>(null)

    const { isConnected, connectWallet } = useWallet()
    const { executeSwap, approveToken, checkAllowance, getTokenBalance, isLoading, error, isSuccess, hash } = useOrbitalAMM()

    // Get token allowances and balances
    const tokenInAllowance = checkAllowance(tokenIn.address)
    const tokenOutAllowance = checkAllowance(tokenOut.address)
    const tokenInBalance = getTokenBalance(tokenIn.address)
    const tokenOutBalance = getTokenBalance(tokenOut.address)
    
    const needsApproval = tokenInAllowance.data ?
        BigInt(tokenInAllowance.data) < BigInt(parseFloat(amountIn || "0") * 1e18) : true

    // Format balance for display
    const formatBalance = (balance: bigint | undefined) => {
        if (!balance) return '0.00'
        const formatted = Number(balance) / 1e18
        return formatted.toFixed(2)
    }

    const exchangeRate = useMemo(() => {
        // Hardcoded for demo - in reality would come from contract
        return 0.98 + Math.random() * 0.04 // Random rate between 0.98-1.02
    }, [tokenIn, tokenOut])

    const priceImpact = useMemo(() => {
        if (!amountIn) return 0
        const amount = parseFloat(amountIn)
        // Simple mock calculation
        return Math.min(amount / 10000, 5) // Max 5% impact
    }, [amountIn])

    // Don't show any output amount - will be fetched from transaction logs
    const expectedAmountOut = '0.0'

    // Watch for successful transactions
    useEffect(() => {
        if (isSuccess && hash && amountIn && transactionDetails === null) {
            const details = {
                hash: hash,
                amountIn: (parseFloat(amountIn) * 1e18).toString(), // Convert to wei for display
                amountOut: '0', // Will be fetched from transaction logs
                tokenInSymbol: tokenIn.symbol,
                tokenOutSymbol: tokenOut.symbol
            }
            setTransactionDetails(details)
            setShowTransactionResult(true)
        }
    }, [isSuccess, hash, amountIn, tokenIn.symbol, tokenOut.symbol, transactionDetails])

    const handleSwapTokens = () => {
        setTokenIn(tokenOut)
        setTokenOut(tokenIn)
        setAmountIn('')
    }

    const handleApprove = async () => {
        try {
            await approveToken(tokenIn.address, amountIn)
        } catch (err) {
            console.error('Approval failed:', err)
        }
    }

    const handleSwap = async () => {
        if (!amountIn || !tokenIn || !tokenOut || !isConnected) return

        try {
            // Reset previous transaction details
            setTransactionDetails(null)
            
            // Find token indices
            const tokenInIndex = TOKENS.findIndex(token =>
                token.address.toLowerCase() === tokenIn.address.toLowerCase()
            )
            const tokenOutIndex = TOKENS.findIndex(token =>
                token.address.toLowerCase() === tokenOut.address.toLowerCase()
            )

            if (tokenInIndex === -1 || tokenOutIndex === -1) {
                alert('Invalid token selection')
                return
            }

            // Execute swap with minAmountOut set to 0 (no slippage protection)
            await executeSwap(tokenInIndex, tokenOutIndex, amountIn, "0")

            // Reset form on success - this will happen after transaction is confirmed
            // setAmountIn('') - moved to transaction result close handler
        } catch (err) {
            console.error('Swap failed:', err)
            alert('Swap failed: ' + (err as Error).message)
        }
    }

    const handleTransactionResultClose = () => {
        setShowTransactionResult(false)
        setTransactionDetails(null)
        setAmountIn('') // Reset form when closing transaction result
    }

    const isValidSwap = amountIn && parseFloat(amountIn) > 0 && isConnected

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto"
        >
            <div className="glass-morphism-dark rounded-3xl p-6 border border-orange-500/20 relative overflow-hidden hover-lift">
                {/* Subtle Animated Background */}
                <div className="absolute inset-0 bg-orange-500/2 animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/60" />

                <div className="relative z-10 space-y-6">
                    {/* Futuristic Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="p-3 bg-orange-500 rounded-xl shadow-lg"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)'
                                }}
                            >
                                <Zap className="w-6 h-6 text-white" />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-gradient font-mono tracking-wider">
                                    ORBITAL SWAP
                                </h2>
                                <p className="text-xs text-orange-300/70 font-mono">
                                    SPHERICAL TRADING PROTOCOL
                                </p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-3 glass-morphism rounded-xl border border-orange-500/20 text-orange-300 hover:text-orange-100 transition-all duration-300"
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Settings className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Futuristic Settings Panel */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -20 }}
                                className="glass-morphism rounded-2xl p-4 border border-orange-500/20 space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-orange-300 mb-3 font-mono tracking-wider">
                                        SLIPPAGE TOLERANCE
                                    </label>
                                    <div className="flex gap-2">
                                        {[0.1, 0.5, 1.0].map((value) => (
                                            <motion.button
                                                key={value}
                                                onClick={() => setSlippage(value)}
                                                className={`flex-1 py-2 px-3 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${slippage === value
                                                    ? 'bg-orange-500 text-white shadow-lg'
                                                    : 'glass-morphism border border-orange-500/20 text-orange-300 hover:text-orange-100'
                                                    }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {value}%
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Futuristic Token Input */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-orange-300 font-mono font-bold tracking-wider">FROM</span>
                            <span className="text-orange-300/70 font-mono">
                                BALANCE: {isConnected ? formatBalance(tokenInBalance.data as bigint) : '0.00'}
                            </span>
                        </div>
                        <div className="relative">
                            <div className="glass-morphism rounded-2xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        value={amountIn}
                                        onChange={(e) => setAmountIn(e.target.value)}
                                        className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-orange-300/50 outline-none font-mono"
                                    />
                                    <div className="flex-shrink-0">
                                        <TokenSelector
                                            selectedToken={tokenIn}
                                            onTokenSelect={setTokenIn}
                                            excludeTokens={[tokenOut.symbol]}
                                            className="w-32"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Futuristic Swap Button */}
                    <div className="flex justify-center">
                        <motion.button
                            onClick={handleSwapTokens}
                            className="p-4 glass-morphism rounded-full border-2 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group"
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
                            }}
                        >
                            <ArrowUpDown className="w-6 h-6 text-orange-300 group-hover:text-orange-100 transition-colors duration-300" />
                        </motion.button>
                    </div>

                    {/* Futuristic Token Output */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-orange-300 font-mono font-bold tracking-wider">TO</span>
                            <span className="text-orange-300/70 font-mono">
                                BALANCE: {isConnected ? formatBalance(tokenOutBalance.data as bigint) : '0.00'}
                            </span>
                        </div>
                        <div className="relative">
                            <div className="glass-morphism rounded-2xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            value={expectedAmountOut}
                                            readOnly
                                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-orange-300/50 outline-none font-mono"
                                        />
                                        {isLoading && (
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                <div className="orbital-loader w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <TokenSelector
                                            selectedToken={tokenOut}
                                            onTokenSelect={setTokenOut}
                                            excludeTokens={[tokenIn.symbol]}
                                            className="w-32"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Futuristic Trade Info */}
                    {isValidSwap && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="glass-morphism rounded-2xl p-4 border border-emerald-500/15 space-y-3"
                        >
                            <div className="flex justify-between text-sm">
                                <span className="text-emerald-300/70 font-mono">EXCHANGE RATE</span>
                                <span className="font-bold text-emerald-300 font-mono">
                                    1 {tokenIn.symbol} = {formatNumber(exchangeRate, 4)} {tokenOut.symbol}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-emerald-300/70 font-mono flex items-center gap-1">
                                    PRICE IMPACT
                                    <Info className="w-3 h-3" />
                                </span>
                                <span className={`font-bold font-mono ${priceImpact > 5 ? 'text-red-400' :
                                    priceImpact > 1 ? 'text-yellow-400' :
                                        'text-emerald-400'
                                    }`}>
                                    {formatNumber(priceImpact, 2)}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-emerald-300/70 font-mono">MINIMUM RECEIVED</span>
                                <span className="font-bold text-emerald-300 font-mono">
                                    0.0 {tokenOut.symbol}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Wallet Connection or Approval/Execute Button */}
                    {!isConnected ? (
                        <motion.button
                            onClick={connectWallet}
                            className="w-full h-16 rounded-2xl font-bold font-mono text-lg tracking-wider transition-all duration-300 relative overflow-hidden bg-blue-500 text-white hover:shadow-2xl hover:shadow-blue-500/30 hover:bg-blue-600"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            <div className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-10 transition-opacity duration-300" />
                            <div className="relative flex items-center justify-center gap-3">
                                CONNECT WALLET
                            </div>
                        </motion.button>
                    ) : needsApproval ? (
                        <motion.button
                            onClick={handleApprove}
                            disabled={isLoading}
                            className={`w-full h-16 rounded-2xl font-bold font-mono text-lg tracking-wider transition-all duration-300 relative overflow-hidden ${isLoading
                                ? 'glass-morphism border border-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-yellow-500 text-white hover:shadow-2xl hover:shadow-yellow-500/30 hover:bg-yellow-600'
                                }`}
                            whileHover={isLoading ? {} : { scale: 1.02, y: -2 }}
                            whileTap={isLoading ? {} : { scale: 0.98 }}
                            style={isLoading ? {} : {
                                boxShadow: '0 0 25px rgba(234, 179, 8, 0.4)'
                            }}
                        >
                            {!isLoading ? (
                                <div className="absolute inset-0 bg-yellow-400 opacity-0 hover:opacity-10 transition-opacity duration-300" />
                            ) : null}
                            <div className="relative flex items-center justify-center gap-3">
                                {isLoading && <div className="orbital-loader w-6 h-6" />}
                                {isLoading ? 'APPROVING...' : `APPROVE ${tokenIn.symbol}`}
                            </div>
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={handleSwap}
                            disabled={!isValidSwap || isLoading}
                            className={`w-full h-16 rounded-2xl font-bold font-mono text-lg tracking-wider transition-all duration-300 relative overflow-hidden ${!isValidSwap || isLoading
                                ? 'glass-morphism border border-gray-500/20 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-500 text-white hover:shadow-2xl hover:shadow-orange-500/30 hover:bg-orange-600'
                                }`}
                            whileHover={!isValidSwap || isLoading ? {} : { scale: 1.02, y: -2 }}
                            whileTap={!isValidSwap || isLoading ? {} : { scale: 0.98 }}
                            style={!isValidSwap || isLoading ? {} : {
                                boxShadow: '0 0 25px rgba(249, 115, 22, 0.4)'
                            }}
                        >
                            {!isValidSwap || isLoading ? null : (
                                <div className="absolute inset-0 bg-orange-400 opacity-0 hover:opacity-10 transition-opacity duration-300" />
                            )}
                            <div className="relative flex items-center justify-center gap-3">
                                {isLoading && <div className="orbital-loader w-6 h-6" />}
                                {isLoading ? 'EXECUTING SWAP...' : 'EXECUTE SWAP'}
                            </div>
                        </motion.button>
                    )}

                    {/* Protocol Information Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4 mt-8"
                    >
                        {/* Price & Liquidity Overview */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                className="glass-morphism rounded-2xl p-4 border border-orange-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="text-xs text-orange-300/70 font-mono mb-1">24H PRICE</div>
                                <div className="text-lg font-bold text-white font-mono">$0.9672</div>
                                <div className="text-xs text-red-400 font-mono">-2.35%</div>
                            </motion.div>
                            <motion.div
                                className="glass-morphism rounded-2xl p-4 border border-orange-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="text-xs text-orange-300/70 font-mono mb-1">TOTAL LIQUIDITY</div>
                                <div className="text-lg font-bold text-white font-mono">$3.54M</div>
                                <div className="text-xs text-emerald-400 font-mono">+12.4%</div>
                            </motion.div>
                        </div>

                        {/* Token Distribution */}
                        <motion.div
                            className="glass-morphism rounded-2xl p-4 border border-orange-500/20"
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-sm text-orange-300 font-mono font-bold">POOL COMPOSITION</div>
                                <div className="text-xs text-orange-300/70 font-mono">5 TOKENS</div>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { token: 'USDC', amount: '$10K', percentage: 20, color: 'bg-orange-500' },
                                    { token: 'USDT', amount: '$10K', percentage: 20, color: 'bg-orange-600' },
                                    { token: 'DAI', amount: '$10K', percentage: 20, color: 'bg-red-500' },
                                    { token: 'FRAX', amount: '$10K', percentage: 20, color: 'bg-red-600' },
                                    { token: 'LUSD', amount: '$10K', percentage: 20, color: 'bg-amber-500' }
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.token}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                            <span className="font-mono text-white/80">{item.token}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-white/60">{item.amount}</span>
                                            <span className="font-mono text-white font-bold w-8 text-right">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Protocol Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <motion.div
                                className="glass-morphism rounded-xl p-3 border border-orange-500/20 text-center"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-xs text-orange-300/70 font-mono mb-1">24H VOLUME</div>
                                <div className="text-sm font-bold text-white font-mono">$2.4M</div>
                            </motion.div>
                            <motion.div
                                className="glass-morphism rounded-xl p-3 border border-orange-500/20 text-center"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-xs text-orange-300/70 font-mono mb-1">FEES EARNED</div>
                                <div className="text-sm font-bold text-white font-mono">$7.2K</div>
                            </motion.div>
                            <motion.div
                                className="glass-morphism rounded-xl p-3 border border-orange-500/20 text-center"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-xs text-orange-300/70 font-mono mb-1">TRADES</div>
                                <div className="text-sm font-bold text-white font-mono">1,247</div>
                            </motion.div>
                        </div>

                        {/* Orbital AMM Features */}
                        <motion.div
                            className="glass-morphism rounded-2xl p-4 border border-orange-500/20"
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="text-sm text-white font-mono font-bold mb-3 flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border border-orange-400 rounded-full"
                                />
                                ORBITAL GEOMETRY ADVANTAGES
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                                <div className="flex items-center gap-2 text-white/70 font-mono">
                                    <div className="w-1 h-1 bg-orange-400 rounded-full" />
                                    Spherical invariant reduces impermanent loss by 40%
                                </div>
                                <div className="flex items-center gap-2 text-white/70 font-mono">
                                    <div className="w-1 h-1 bg-orange-500 rounded-full" />
                                    Torus topology enables multi-asset efficiency
                                </div>
                                <div className="flex items-center gap-2 text-white/70 font-mono">
                                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                                    Orbital mechanics optimize capital utilization
                                </div>
                            </div>
                        </motion.div>

                        {/* Activity Indicator */}
                        <motion.div
                            className="flex items-center justify-center gap-2 text-xs text-white/50 font-mono"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <motion.div
                                className="w-2 h-2 bg-orange-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            PROTOCOL ACTIVE • REAL-TIME PRICING • ARBITRUM STYLUS
                        </motion.div>
                    </motion.div>

                    {/* Futuristic Warning */}
                    {priceImpact > 5 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="glass-morphism rounded-2xl p-4 border border-red-500/30 bg-red-500/5"
                        >
                            <div className="flex items-center gap-3 text-red-400">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    <Info className="w-5 h-5" />
                                </motion.div>
                                <span className="font-bold font-mono tracking-wider">HIGH PRICE IMPACT WARNING</span>
                            </div>
                            <p className="text-sm text-red-300/80 mt-2 font-mono">
                                This trade will significantly impact token price. Consider reducing trade size.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Transaction Result Modal */}
            <TransactionResult
                isOpen={showTransactionResult}
                onClose={handleTransactionResultClose}
                transactionHash={transactionDetails?.hash}
                amountIn={transactionDetails?.amountIn || '0'}
                amountOut={transactionDetails?.amountOut || '0'}
                tokenInSymbol={transactionDetails?.tokenInSymbol || ''}
                tokenOutSymbol={transactionDetails?.tokenOutSymbol || ''}
                networkName="Arbitrum Sepolia"
            />
        </motion.div>
    )
}