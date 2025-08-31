// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract Pool {
   
   // mapping of tick -> unique tick id
   // define total reserves, sum of squared reserves, interior ticks data, boundary ticks data 
   // define tick struct (R,P, liquidity, reserves, total_lp_shares, lp_shares owners, status, accured fees)
   // define add liquidity function
        // step -1: liquidity provider provides his tick data and token amounts 
        // step -2: check if tick exists, if not create it
        // step -3: calculate how many lp shares to mint
        // step -4: mint lp shares to liquidity provider
        // step -5: update tick data and pool data
   // define remove liquidity function
        // step -1: liquidity provider provides his tick id and lp shares to burn
        // step -2: calculate how many tokens to return
        // step -3: burn lp shares
        // step -4: update tick data and pool data
        // step -5: transfer tokens to liquidity provider
   // define swap function
        // step -1: user provides input token address, amount and output token address
        // step -2: solve the global trade invariant for the amount_out, assuming the entire trade happens in one step without any tick changing its status 
        // step -3: segment the trade if required and update ticks status
        // step -4: transfer tokens
        // step -5: distribute fees to ticks by checking which were active based on their defined price contained the trade execution price 
    // helper functions
        // function to get current price
        // function to get tick data
        // function to get pool data
        // function to get lp shares of a liquidity provider
        // function to calculate global trade invariant 
        // function to calculate tick's liquidity given R&P 
        // function to update tick's status if boundary is crossed 
}
