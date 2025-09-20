import {
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Swap as SwapEvent,
  TickStatusChanged as TickStatusChangedEvent
} from "../generated/OrbitalPool/OrbitalPool"
import {
  LiquidityAdded,
  LiquidityRemoved,
  Swap,
  TickStatusChanged
} from "../generated/schema"

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  let entity = new LiquidityAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.provider = event.params.provider
  entity.k = event.params.k
  entity.amounts = event.params.amounts
  entity.lpShares = event.params.lpShares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let entity = new LiquidityRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.provider = event.params.provider
  entity.k = event.params.k
  entity.amounts = event.params.amounts
  entity.lpShares = event.params.lpShares

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSwap(event: SwapEvent): void {
  let entity = new Swap(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.trader = event.params.trader
  entity.tokenIn = event.params.tokenIn
  entity.tokenOut = event.params.tokenOut
  entity.amountIn = event.params.amountIn
  entity.amountOut = event.params.amountOut
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTickStatusChanged(event: TickStatusChangedEvent): void {
  let entity = new TickStatusChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.k = event.params.k
  entity.oldStatus = event.params.oldStatus
  entity.newStatus = event.params.newStatus

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
