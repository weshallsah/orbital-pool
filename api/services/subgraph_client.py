"""
Subgraph client for Orbital AMM analytics
Handles GraphQL queries to The Graph protocol
"""

import requests
import os
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta

class OrbitalSubgraphClient:
    def __init__(self):
        # Use environment variable for subgraph URL
        self.endpoint = os.getenv('ORBITAL_SUBGRAPH_URL', 
            'https://api.studio.thegraph.com/query/121293/orbital-amm-subgraph/v0.0.1')
        self.timeout = 30
        
    def query(self, query_string: str, variables: Dict = None) -> Dict:
        """Execute GraphQL query against subgraph"""
        try:
            payload = {
                'query': query_string,
                'variables': variables or {}
            }
            
            response = requests.post(
                self.endpoint, 
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            result = response.json()
            
            if 'errors' in result:
                raise Exception(f"GraphQL error: {result['errors']}")
                
            return result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Subgraph request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response: {str(e)}")
    
    def get_protocol_stats(self) -> Dict:
        """Get overall Orbital AMM protocol statistics"""
        query = """
        query {
          _meta {
            block {
              number
            }
          }
        }
        """
        
        result = self.query(query)
        block_data = result.get('data', {}).get('_meta', {})
        
        # Return basic stats since we don't have the full schema yet
        return {
            "totalValueLockedUSD": "0",
            "totalVolumeUSD": "0", 
            "totalSwapCount": "0",
            "totalTokenCount": "5",  # Your 5 test tokens
            "protocolFeeRate": "0.003",
            "latestBlock": block_data.get('block', {}).get('number', '0')
        }
    
    def get_recent_swaps(self, limit: int = 100, skip: int = 0) -> List[Dict]:
        """Get recent swaps with pagination"""
        query = """
        query GetRecentSwaps($first: Int!, $skip: Int!) {
          swaps(
            first: $first
            skip: $skip
            orderBy: blockTimestamp
            orderDirection: desc
          ) {
            id
            trader
            tokenIn
            tokenOut
            amountIn
            amountOut
            fee
            blockNumber
            blockTimestamp
            transactionHash
          }
        }
        """
        
        result = self.query(query, {'first': min(limit, 1000), 'skip': skip})
        return result.get('data', {}).get('swaps', [])
    
    def get_token_stats(self, token_address: str = None, token_index: int = None) -> Dict:
        """Get statistics for specific token by address or index"""
        # For now, return basic token info since we don't have token entities
        return {
            "id": token_address or f"token-{token_index}",
            "symbol": f"Token {chr(65 + (token_index or 0))}" if token_index is not None else "Unknown",
            "name": f"Token {chr(65 + (token_index or 0))}" if token_index is not None else "Unknown Token",
            "totalVolumeUSD": "0",
            "totalLiquidityUSD": "0",
            "txCount": "0",
            "priceUSD": "1.0"
        }
    
    def get_daily_volume(self, days: int = 30) -> List[Dict]:
        """Get daily volume data for charts"""
        # For now, return empty array since we don't have daily data entities
        return []
    
    def get_user_stats(self, user_address: str) -> Dict:
        """Get statistics for specific user"""
        query = """
        query GetUserSwaps($user: String!) {
          swaps(where: { trader: $user }) {
            id
            amountIn
            amountOut
            fee
            blockTimestamp
            transactionHash
          }
        }
        """
        
        result = self.query(query, {'user': user_address.lower()})
        swaps = result.get('data', {}).get('swaps', [])
        
        if not swaps:
            return None
            
        total_volume = sum(float(swap.get('amountIn', 0)) for swap in swaps)
        total_fees = sum(float(swap.get('fee', 0)) for swap in swaps)
        
        return {
            "id": user_address,
            "totalSwaps": len(swaps),
            "totalVolumeUSD": str(total_volume),
            "totalFeesUSD": str(total_fees),
            "firstSwapTimestamp": swaps[-1].get('blockTimestamp') if swaps else None,
            "lastSwapTimestamp": swaps[0].get('blockTimestamp') if swaps else None
        }
    
    def get_top_tokens_by_volume(self, limit: int = 10) -> List[Dict]:
        """Get top tokens by trading volume"""
        # For now, return your 5 test tokens
        tokens = []
        for i in range(5):
            tokens.append({
                "id": f"token-{i}",
                "symbol": f"Token {chr(65 + i)}",
                "name": f"Token {chr(65 + i)}",
                "totalVolumeUSD": "0",
                "totalLiquidityUSD": "0",
                "txCount": "0",
                "priceUSD": "1.0"
            })
        return tokens[:limit]
    
    def get_swap_by_tx(self, tx_hash: str) -> List[Dict]:
        """Get swaps from specific transaction"""
        query = """
        query GetSwapsByTx($txHash: String!) {
          swaps(where: { transactionHash: $txHash }) {
            id
            trader
            tokenIn
            tokenOut
            amountIn
            amountOut
            fee
            blockTimestamp
          }
        }
        """
        
        result = self.query(query, {'txHash': tx_hash.lower()})
        return result.get('data', {}).get('swaps', [])