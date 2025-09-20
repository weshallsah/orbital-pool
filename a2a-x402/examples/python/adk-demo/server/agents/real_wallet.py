# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import logging
from typing import Optional
from eth_account import Account
from x402_a2a.types import PaymentPayload, x402PaymentRequiredResponse
from x402_a2a.core.wallet import process_payment_required


class RealWallet:
    """
    Real wallet implementation for Arbitrum Sepolia testnet.
    Uses actual private keys to sign payment authorizations.
    """
    
    def __init__(self, private_key: str):
        """Initialize wallet with private key."""
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        logging.info(f"Initialized wallet for address: {self.address}")
    
    async def sign_payment(
        self, 
        payment_required: x402PaymentRequiredResponse,
        max_value: Optional[int] = None
    ) -> PaymentPayload:
        """Sign payment authorization using real private key."""
        logging.info(f"Signing payment with wallet: {self.address}")
        
        try:
            # Use the core x402_a2a wallet functions
            payment_payload = process_payment_required(
                payment_required, 
                self.account, 
                max_value
            )
            
            logging.info(f"Payment signed successfully by: {self.address}")
            return payment_payload
            
        except Exception as e:
            logging.error(f"Payment signing failed: {e}")
            raise


def get_client_wallet() -> RealWallet:
    """Get the client wallet from environment variables."""
    private_key = os.getenv("CLIENT_PRIVATE_KEY")
    if not private_key:
        raise ValueError("CLIENT_PRIVATE_KEY environment variable not set")
    return RealWallet(private_key)


def get_merchant_wallet() -> RealWallet:
    """Get the merchant wallet from environment variables.""" 
    private_key = os.getenv("MERCHANT_PRIVATE_KEY")
    if not private_key:
        raise ValueError("MERCHANT_PRIVATE_KEY environment variable not set")
    return RealWallet(private_key)
