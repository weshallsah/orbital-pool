'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ExternalLink, Copy, X, ArrowRight, Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'
import { getSwapDetailsFromTx } from '@/lib/arbiscan'
import { POOL_CONFIG } from '@/lib/constants'

interface TransactionResultProps {
  isOpen: boolean
  onClose: () => void
  transactionHash?: string
  amountIn: string
  amountOut: string
  tokenInSymbol: string
  tokenOutSymbol: string
  gasUsed?: string
  networkName?: string
}

export function TransactionResult({
  isOpen,
  onClose,
  transactionHash,
  amountIn,
  amountOut,
  tokenInSymbol,
  tokenOutSymbol,
  gasUsed,
  networkName = 'Arbitrum Sepolia'
}: TransactionResultProps) {
  const [copied, setCopied] = useState(false)
  const [realAmountOut, setRealAmountOut] = useState<string | null>(null)
  const [isLoadingTxData, setIsLoadingTxData] = useState(false)

  const getExplorerUrl = (hash: string) => {
    // Arbitrum Sepolia testnet explorer
    return `https://sepolia.arbiscan.io/tx/${hash}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Fetch real transaction data when modal opens
  useEffect(() => {
    if (isOpen && transactionHash && !realAmountOut) {
      setIsLoadingTxData(true)
      
      // Add a small delay to ensure transaction is mined
      const fetchTxData = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          const swapDetails = await getSwapDetailsFromTx(transactionHash, POOL_CONFIG.address)
          
          if (swapDetails && swapDetails.amountOut !== '0') {
            setRealAmountOut(swapDetails.amountOut)
          }
        } catch (error) {
          console.error('Error fetching transaction data:', error)
        } finally {
          setIsLoadingTxData(false)
        }
      }
      
      fetchTxData()
    }
  }, [isOpen, transactionHash, realAmountOut])

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      const formatted = formatUnits(BigInt(amount), decimals)
      return parseFloat(formatted).toFixed(6)
    } catch {
      return amount
    }
  }

  const getDisplayAmountOut = () => {
    if (isLoadingTxData) {
      return 'Loading...'
    }
    if (realAmountOut && realAmountOut !== '0') {
      return formatAmount(realAmountOut)
    }
    return 'Fetching...'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-morphism-dark rounded-3xl p-8 border border-emerald-500/30 max-w-md w-full relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/60" />

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 glass-morphism rounded-xl border border-gray-500/20 text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 space-y-6">
                {/* Success Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4"
                    style={{
                      boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-emerald-400 font-mono tracking-wider">
                    SWAP SUCCESSFUL
                  </h2>
                  <p className="text-sm text-emerald-300/70 font-mono mt-1">
                    Transaction confirmed on {networkName}
                  </p>
                </div>

                {/* Swap Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-morphism rounded-2xl p-6 border border-emerald-500/20 space-y-4"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white font-mono">
                          {formatAmount(amountIn)}
                        </div>
                        <div className="text-sm text-emerald-300/70 font-mono">
                          {tokenInSymbol}
                        </div>
                      </div>
                      
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-emerald-400" />
                      </motion.div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center justify-center gap-2">
                          {isLoadingTxData && (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          )}
                          {getDisplayAmountOut()}
                        </div>
                        <div className="text-sm text-emerald-300/70 font-mono">
                          {tokenOutSymbol}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {gasUsed && (
                    <div className="flex justify-between text-sm pt-4 border-t border-emerald-500/20">
                      <span className="text-emerald-300/70 font-mono">Gas Used:</span>
                      <span className="text-emerald-300 font-mono font-bold">{gasUsed}</span>
                    </div>
                  )}
                </motion.div>

                {/* Transaction Hash */}
                {transactionHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="text-sm text-emerald-300/70 font-mono font-bold">
                      TRANSACTION HASH
                    </div>
                    <div className="glass-morphism rounded-xl p-3 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-sm font-mono text-white/80 truncate">
                          {transactionHash}
                        </div>
                        <motion.button
                          onClick={() => copyToClipboard(transactionHash)}
                          className="p-2 glass-morphism rounded-lg border border-emerald-500/20 text-emerald-300 hover:text-emerald-100 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                      </div>
                      {copied && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-emerald-400 font-mono mt-1"
                        >
                          Copied to clipboard!
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {transactionHash && (
                    <motion.a
                      href={getExplorerUrl(transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-xl font-bold font-mono text-sm tracking-wider transition-all duration-300 relative overflow-hidden bg-emerald-500 text-white hover:shadow-2xl hover:shadow-emerald-500/30 hover:bg-emerald-600 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <div className="absolute inset-0 bg-emerald-400 opacity-0 hover:opacity-10 transition-opacity duration-300" />
                      <div className="relative flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        VIEW ON ARBISCAN
                      </div>
                    </motion.a>
                  )}

                  <motion.button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl font-bold font-mono text-sm tracking-wider transition-all duration-300 glass-morphism border border-gray-500/20 text-gray-300 hover:text-white hover:border-gray-400/40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    CLOSE
                  </motion.button>
                </div>

                {/* Protocol Badge */}
                <motion.div
                  className="flex items-center justify-center gap-2 text-xs text-emerald-400/70 font-mono"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  POWERED BY ORBITAL AMM • ARBITRUM STYLUS
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
