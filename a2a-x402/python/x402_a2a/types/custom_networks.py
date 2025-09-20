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

"""Custom network types that extend x402 core library to support additional networks."""

from typing import Literal, Union
from x402.types import SupportedNetworks as CoreSupportedNetworks

# Extended network type that includes Arbitrum Sepolia
ExtendedSupportedNetworks = Union[
    CoreSupportedNetworks,
    Literal["arbitrum-sepolia"]
]

# Network configuration for Arbitrum Sepolia
ARBITRUM_SEPOLIA_CONFIG = {
    "chain_id": 421614,
    "rpc_url": "https://sepolia-rollup.arbitrum.io/rpc",
    "name": "Arbitrum Sepolia",
    "native_currency": {
        "name": "Ethereum",
        "symbol": "ETH",
        "decimals": 18
    }
}

# Network to chain ID mapping
NETWORK_CHAIN_IDS = {
    "base": 8453,
    "base-sepolia": 84532,
    "avalanche": 43114,
    "avalanche-fuji": 43113,
    "arbitrum-sepolia": 421614,
}

def is_supported_network(network: str) -> bool:
    """Check if a network is supported (including custom networks)."""
    return network in NETWORK_CHAIN_IDS

def get_chain_id(network: str) -> int:
    """Get chain ID for a given network."""
    if network not in NETWORK_CHAIN_IDS:
        raise ValueError(f"Unsupported network: {network}")
    return NETWORK_CHAIN_IDS[network]
