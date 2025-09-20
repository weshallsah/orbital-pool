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

"""Custom PaymentRequirements that supports extended networks including Arbitrum Sepolia."""

from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field
from x402.types import PaymentRequirements as CorePaymentRequirements
from .custom_networks import ExtendedSupportedNetworks, is_supported_network


class CustomPaymentRequirements(BaseModel):
    """
    Custom PaymentRequirements that supports Arbitrum Sepolia and other extended networks.
    This bypasses the core x402 library's network validation.
    """
    scheme: str = Field(default="exact")
    network: ExtendedSupportedNetworks
    asset: str
    pay_to: str
    max_amount_required: int
    resource: str
    description: str = Field(default="")
    mime_type: str = Field(default="application/json")
    max_timeout_seconds: int = Field(default=600)
    output_schema: Optional[Any] = Field(default=None)
    extra: Optional[Dict[str, Any]] = Field(default=None)

    def __init__(self, **data):
        # Validate network before creating
        network = data.get('network')
        if network and not is_supported_network(network):
            raise ValueError(f"Unsupported network: {network}")
        super().__init__(**data)

    def to_core_requirements(self) -> CorePaymentRequirements:
        """
        Convert to core PaymentRequirements by mapping arbitrum-sepolia to base-sepolia
        for compatibility with core x402 library while keeping our custom network info.
        """
        # Map arbitrum-sepolia to base-sepolia for core compatibility
        core_network = "base-sepolia" if self.network == "arbitrum-sepolia" else self.network
        
        return CorePaymentRequirements(
            scheme=self.scheme,
            network=core_network,
            asset=self.asset,
            pay_to=self.pay_to,
            max_amount_required=self.max_amount_required,
            resource=self.resource,
            description=self.description,
            mime_type=self.mime_type,
            max_timeout_seconds=self.max_timeout_seconds,
            output_schema=self.output_schema,
            extra={
                **(self.extra or {}),
                # Store the actual network we want to use
                "actual_network": self.network,
                "arbitrum_sepolia_override": True if self.network == "arbitrum-sepolia" else False
            }
        )

    def model_dump(self, **kwargs):
        """Override model_dump to return core-compatible format."""
        return self.to_core_requirements().model_dump(**kwargs)

    def dict(self, **kwargs):
        """Override dict to return core-compatible format."""
        return self.to_core_requirements().dict(**kwargs)
