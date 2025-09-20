import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  LiquidityAdded,
  LiquidityRemoved,
  Swap,
  TickStatusChanged
} from "../generated/OrbitalPool/OrbitalPool"

export function createLiquidityAddedEvent(
  provider: Address,
  k: BigInt,
  amounts: Array<BigInt>,
  lpShares: BigInt
): LiquidityAdded {
  let liquidityAddedEvent = changetype<LiquidityAdded>(newMockEvent())

  liquidityAddedEvent.parameters = new Array()

  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam("k", ethereum.Value.fromUnsignedBigInt(k))
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam(
      "amounts",
      ethereum.Value.fromUnsignedBigIntArray(amounts)
    )
  )
  liquidityAddedEvent.parameters.push(
    new ethereum.EventParam(
      "lpShares",
      ethereum.Value.fromUnsignedBigInt(lpShares)
    )
  )

  return liquidityAddedEvent
}

export function createLiquidityRemovedEvent(
  provider: Address,
  k: BigInt,
  amounts: Array<BigInt>,
  lpShares: BigInt
): LiquidityRemoved {
  let liquidityRemovedEvent = changetype<LiquidityRemoved>(newMockEvent())

  liquidityRemovedEvent.parameters = new Array()

  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam("provider", ethereum.Value.fromAddress(provider))
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam("k", ethereum.Value.fromUnsignedBigInt(k))
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "amounts",
      ethereum.Value.fromUnsignedBigIntArray(amounts)
    )
  )
  liquidityRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "lpShares",
      ethereum.Value.fromUnsignedBigInt(lpShares)
    )
  )

  return liquidityRemovedEvent
}

export function createSwapEvent(
  trader: Address,
  tokenIn: BigInt,
  tokenOut: BigInt,
  amountIn: BigInt,
  amountOut: BigInt,
  fee: BigInt
): Swap {
  let swapEvent = changetype<Swap>(newMockEvent())

  swapEvent.parameters = new Array()

  swapEvent.parameters.push(
    new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "tokenIn",
      ethereum.Value.fromUnsignedBigInt(tokenIn)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "tokenOut",
      ethereum.Value.fromUnsignedBigInt(tokenOut)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "amountIn",
      ethereum.Value.fromUnsignedBigInt(amountIn)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "amountOut",
      ethereum.Value.fromUnsignedBigInt(amountOut)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return swapEvent
}

export function createTickStatusChangedEvent(
  k: BigInt,
  oldStatus: i32,
  newStatus: i32
): TickStatusChanged {
  let tickStatusChangedEvent = changetype<TickStatusChanged>(newMockEvent())

  tickStatusChangedEvent.parameters = new Array()

  tickStatusChangedEvent.parameters.push(
    new ethereum.EventParam("k", ethereum.Value.fromUnsignedBigInt(k))
  )
  tickStatusChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldStatus))
    )
  )
  tickStatusChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newStatus))
    )
  )

  return tickStatusChangedEvent
}
