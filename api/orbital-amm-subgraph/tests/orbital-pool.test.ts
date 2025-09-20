import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LiquidityAdded } from "../generated/schema"
import { LiquidityAdded as LiquidityAddedEvent } from "../generated/OrbitalPool/OrbitalPool"
import { handleLiquidityAdded } from "../src/orbital-pool"
import { createLiquidityAddedEvent } from "./orbital-pool-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let provider = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let k = BigInt.fromI32(234)
    let amounts = [BigInt.fromI32(234)]
    let lpShares = BigInt.fromI32(234)
    let newLiquidityAddedEvent = createLiquidityAddedEvent(
      provider,
      k,
      amounts,
      lpShares
    )
    handleLiquidityAdded(newLiquidityAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("LiquidityAdded created and stored", () => {
    assert.entityCount("LiquidityAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "LiquidityAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "provider",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "LiquidityAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "k",
      "234"
    )
    assert.fieldEquals(
      "LiquidityAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amounts",
      "[234]"
    )
    assert.fieldEquals(
      "LiquidityAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "lpShares",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
