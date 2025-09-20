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
import hashlib
from typing import override

from a2a.types import AgentCard, AgentCapabilities, AgentSkill
from google.adk.agents import LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.genai import types
from x402_a2a.types import x402PaymentRequiredException, PaymentRequirements
from .base_agent import BaseAgent
from x402_a2a import (
    x402Utils,
    get_extension_declaration
)

# This is the new, clean ADK Merchant Agent.
# It now implements the BaseAgent interface.

class AdkMerchantAgent(BaseAgent):
    """
    Defines the ADK LlmAgent for the merchant and its corresponding AgentCard.
    The business logic is implemented as tools.
    """

    def __init__(self, wallet_address: str = None):
        import os
        self._wallet_address = wallet_address or os.getenv("MERCHANT_ADDRESS", "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B")
        self.x402 = x402Utils()

    def _get_product_price(self, product_name: str) -> str:
        """Generates a deterministic price for a product."""
        # Generate larger amounts to make wallet changes more visible
        # Using 6 decimals: 1000 USDC = 1000000000 wei
        base_price = (
            int(hashlib.sha256(product_name.lower().encode()).hexdigest(), 16)
            % 500000000  # Up to 500 USDC
            + 1000000000  # Minimum 1000 USDC
        )
        return str(base_price)

    def get_product_details_and_request_payment(self, product_name: str) -> dict:
        """
        This is the agent's tool. Instead of returning payment details, it raises
        an exception to signal to the x402 wrapper that payment is needed.
        """
        if not product_name:
            return {"error": "Product name cannot be empty."}

        import os
        price = self._get_product_price(product_name)
        # Use base-sepolia for validation but mark as Arbitrum Sepolia override
        requirements = PaymentRequirements(
            scheme="exact",
            network="base-sepolia",  # Use supported network for validation
            asset=os.getenv("USDC_CONTRACT_ADDRESS", "0x9666526dcF585863f9ef52D76718d810EE77FB8D"),
            pay_to=self._wallet_address,
            max_amount_required=price,
            description=f"Payment for: {product_name}",
            resource=f"https://example.com/product/{product_name}",
            mime_type="application/json",
            max_timeout_seconds=1200,
            extra={
                "name": "Mock USDC A",
                "version": "2",
                "product": {
                    "sku": f"{product_name}_sku", 
                    "name":  product_name, 
                    "version": '1'
                },
                # Mark this as Arbitrum Sepolia override for RealFacilitator
                "actual_network": "arbitrum-sepolia",
                "arbitrum_sepolia_override": True
            },
        )
        
        # Signal to the x402ServerAgentExecutor that payment is required.
        # The wrapper will catch this and handle the A2A flow.
        raise x402PaymentRequiredException(product_name, requirements)

    def before_agent_callback(self, callback_context: CallbackContext):
        """
        Injects a 'virtual' tool response if payment has been verified.
        """
        payment_data = callback_context.state.get('payment_verified_data')
        if payment_data:
            # Consume the data so it's not used again in the same session.
            del callback_context.state['payment_verified_data']
            
            # Create a Content object that looks like a tool call response.
            # This is a structured way to inform the LLM of the payment status.
            tool_response = types.Part(
                function_response=types.FunctionResponse(
                    name="check_payment_status",
                    response=payment_data,
                )
            )
            # Set this as the new, overriding input for this turn.
            callback_context.new_user_message = types.Content(parts=[tool_response])


    @override
    def create_agent(self) -> LlmAgent:
        """Creates the LlmAgent instance for the merchant."""
        return LlmAgent(
            model="gemini-2.5-flash",
            name="adk_merchant_agent",
            description="An agent that can sell any item by providing a price and then processing the payment using the x402 protocol.",
            instruction="""You are a helpful and friendly "Amazon" merchant agent.
- When a user asks to buy an item, use the `get_product_details_and_request_payment` tool.
- If you receive a successful result from the `check_payment_status` tool, you MUST confirm the purchase with the user and tell them their order is being prepared. Do not ask for payment again.
- If the system tells you the payment failed, relay the error clearly and politely.
""",
            tools=[self.get_product_details_and_request_payment],
            before_agent_callback=self.before_agent_callback,
        )

    @override
    def create_agent_card(self, url: str) -> AgentCard:
        """Creates the AgentCard for this agent."""
        skills = [
            AgentSkill(
                id="get_product_info",
                name="Get Product Price and Payment Info",
                description="Provides the price, SKU, and x402 payment requirements for any given product.",
                tags=["pricing", "product", "x402", "merchant"],
                examples=[
                    "How much for a new laptop?",
                    "I want to buy a red stapler.",
                    "Can you give me the price for a copy of 'Moby Dick'?",
                ],
            )
        ]
        return AgentCard(
            name="x402 Merchant Agent",
            description="This agent sells items using the clean x402 server architecture.",
            url=url,
            version="4.0.0",
            defaultInputModes=["text", "text/plain"],
            defaultOutputModes=["text", "text/plain"],
            capabilities=AgentCapabilities(
                streaming=False,
                extensions=[
                    get_extension_declaration(
                        description="Supports payments using the x402 protocol.",
                        required=True,
                    )
                ],
            ),
            skills=skills,
        )
