/**
 * Arbiscan API utilities for fetching transaction data
 */

interface SwapEventLog {
  amountIn: string
  amountOut: string
  tokenInIndex: string
  tokenOutIndex: string
}

interface TransactionReceipt {
  logs: Array<{
    topics: string[]
    data: string
  }>
}

/**
 * Fetch transaction receipt from Arbiscan API
 */
export async function fetchTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
  try {
    // Arbiscan API endpoint for Arbitrum Sepolia (no API key needed for basic calls)
    const apiUrl = `https://api-sepolia.arbiscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.status === '1' && data.result) {
      return data.result
    }
    
    return null
  } catch (error) {
    console.error('Error fetching transaction receipt:', error)
    return null
  }
}

/**
 * Parse Swap event from transaction logs
 * Based on the Swap event signature from OrbitalPool contract
 */
export function parseSwapEvent(receipt: TransactionReceipt): SwapEventLog | null {
  try {
    // Look for Swap event by checking event signature hash
    // Swap(address indexed trader, uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)
    const swapEventSignature = 'Swap(address,uint256,uint256,uint256,uint256,uint256)'
    
    // Find the Swap event log by looking for the event signature in topics
    const swapLog = receipt.logs.find(log => {
      if (!log.topics || log.topics.length === 0) return false
      // The first topic is the event signature hash
      // We'll look for logs that have the right structure for a Swap event
      return log.data && log.data.length > 2 && log.topics.length >= 2
    })
    
    if (!swapLog || !swapLog.data) {
      return null
    }
    
    // Parse the data field which contains non-indexed parameters
    // Remove '0x' prefix
    const data = swapLog.data.replace('0x', '')
    
    // Each parameter is 64 hex characters (32 bytes)
    // For Swap event: tokenIn, tokenOut, amountIn, amountOut, fee
    if (data.length < 320) { // 5 parameters * 64 chars each
      return null
    }
    
    const tokenIn = parseInt(data.substring(0, 64), 16).toString()
    const tokenOut = parseInt(data.substring(64, 128), 16).toString()
    const amountIn = '0x' + data.substring(128, 192)
    const amountOut = '0x' + data.substring(192, 256)
    
    return {
      tokenInIndex: tokenIn,
      tokenOutIndex: tokenOut,
      amountIn: BigInt(amountIn).toString(),
      amountOut: BigInt(amountOut).toString()
    }
  } catch (error) {
    console.error('Error parsing swap event:', error)
    return null
  }
}

/**
 * Alternative method: Parse Transfer events to get actual amounts
 * This is more reliable as Transfer events are standard ERC20 events
 */
export function parseTransferEvents(receipt: TransactionReceipt, poolAddress: string): {
  amountIn: string
  amountOut: string
} | null {
  try {
    // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    
    const transfers = receipt.logs.filter(log => 
      log.topics && log.topics[0] === transferTopic
    )
    
    let amountIn = '0'
    let amountOut = '0'
    
    for (const transfer of transfers) {
      const from = '0x' + transfer.topics[1].substring(26) // Remove padding
      const to = '0x' + transfer.topics[2].substring(26) // Remove padding
      const value = BigInt(transfer.data).toString()
      
      // Transfer TO pool (user sending tokens)
      if (to.toLowerCase() === poolAddress.toLowerCase()) {
        amountIn = value
      }
      // Transfer FROM pool (user receiving tokens)
      else if (from.toLowerCase() === poolAddress.toLowerCase()) {
        amountOut = value
      }
    }
    
    return { amountIn, amountOut }
  } catch (error) {
    console.error('Error parsing transfer events:', error)
    return null
  }
}

/**
 * Get swap details from transaction hash
 */
export async function getSwapDetailsFromTx(txHash: string, poolAddress: string): Promise<{
  amountIn: string
  amountOut: string
} | null> {
  try {
    const receipt = await fetchTransactionReceipt(txHash)
    if (!receipt) {
      return null
    }
    
    // Try parsing Transfer events first (more reliable)
    const transferData = parseTransferEvents(receipt, poolAddress)
    if (transferData && transferData.amountOut !== '0') {
      return transferData
    }
    
    // Fallback to parsing Swap event
    const swapData = parseSwapEvent(receipt)
    if (swapData) {
      return {
        amountIn: swapData.amountIn,
        amountOut: swapData.amountOut
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting swap details:', error)
    return null
  }
}
