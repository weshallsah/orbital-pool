# Examples

Some code to get you started.

## Basic swap

```javascript
async function swapTokens() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();

  // Call the API
  const response = await fetch('http://localhost:8000/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token_in_index: 0,
      token_out_index: 1,
      amount_in: ethers.utils.parseEther('1').toString(),
      min_amount_out: '0',
      user_address: userAddress
    })
  });

  const data = await response.json();
  
  // Send the transaction
  if (data.success) {
    const tx = await signer.sendTransaction(data.transaction_data);
    console.log('Swap done:', tx.hash);
    return await tx.wait();
  }
}
```

## Python version

```python
import requests
from web3 import Web3

def swap_tokens(private_key, amount_in):
    w3 = Web3(Web3.HTTPProvider('https://sepolia-rollup.arbitrum.io/rpc'))
    account = w3.eth.account.from_key(private_key)
    
    # Call API
    response = requests.post('http://localhost:8000/swap', json={
        'token_in_index': 0,
        'token_out_index': 1,
        'amount_in': str(amount_in),
        'min_amount_out': '0',
        'user_address': account.address
    })
    
    data = response.json()
    
    # Send transaction
    if data['success']:
        signed_txn = w3.eth.account.sign_transaction(
            data['transaction_data'], 
            private_key
        )
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        return w3.eth.wait_for_transaction_receipt(tx_hash)
```

## Add liquidity

```javascript
async function addLiquidity() {
  const response = await fetch('http://localhost:8000/liquidity/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      k_value: 1000,
      amounts: [
        "1000000000000000000",  // 1 token of each
        "1000000000000000000",
        "1000000000000000000",
        "1000000000000000000",
        "1000000000000000000"
      ],
      user_address: await signer.getAddress()
    })
  });

  const data = await response.json();
  if (data.success) {
    const tx = await signer.sendTransaction(data.transaction_data);
    console.log('Liquidity added:', tx.hash);
  }
}
```

## Check analytics

```javascript
async function getStats() {
  // Protocol stats
  const statsResponse = await fetch('http://localhost:8000/analytics/stats');
  const stats = await statsResponse.json();
  console.log('Total volume:', stats.data.totalVolumeUSD);

  // Recent swaps
  const swapsResponse = await fetch('http://localhost:8000/analytics/swaps?limit=5');
  const swaps = await swapsResponse.json();
  console.log('Recent swaps:', swaps.data.swaps.length);

  // Token data
  const tokenResponse = await fetch('http://localhost:8000/analytics/token/0');
  const token = await tokenResponse.json();
  console.log('Token 0 volume:', token.data.stats.totalVolumeUSD);
}
```

## Simple monitoring script

```python
import requests
import time

def monitor_pool():
    while True:
        try:
            response = requests.get('http://localhost:8000/analytics/stats')
            data = response.json()
            
            if data.get('success'):
                stats = data['data']
                print(f"Volume: ${stats.get('totalVolumeUSD', '0')}")
                print(f"Swaps: {stats.get('totalSwapCount', '0')}")
            
            time.sleep(60)  # Check every minute
        except:
            print("API not available")
            time.sleep(60)

monitor_pool()
```

That's it! These examples should get you started with the Orbital Pool API.
