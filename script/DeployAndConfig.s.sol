// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {OrbitalPool} from "../src/IntegratedOrbital.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DeployAndTest
 * @notice Complete deployment and testing script for OrbitalPool
 * @dev Deploys tokens, pool, approves, adds liquidity, and executes swap
 */
contract DeployAndTest is Script {
        // Constants
    address constant MATH_HELPER = 0x112F137fcB7fA9Ed84A54767aD4d555904F274d9;
    uint256 constant TOKENS_COUNT = 5;
    uint256 constant PRECISION = 1e15; // Use 1e15 precision as requested
    uint256 constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15
    
    // Deployed contracts
    OrbitalPool public orbitalPool;
    MockUSDC[TOKENS_COUNT] public mockTokens;
    
    function run() external {
        vm.startBroadcast();
        
        console.log("=== ORBITAL POOL DEPLOYMENT AND TESTING ===");
        console.log("Math Helper Address:", MATH_HELPER);
        console.log("Deployer:", msg.sender);
        
        // Step 1: Deploy MockUSDC tokens
        _deployTokens();
        
        // Step 2: Deploy OrbitalPool
        _deployPool();
        
        // Step 3: Approve tokens for the pool
        _approveTokens();
        
        console.log("=== DEPLOYMENT AND TESTING COMPLETED ===");
        
        vm.stopBroadcast();
    }
    
    function _deployTokens() internal {
        console.log("\n--- DEPLOYING MOCK USDC TOKENS ---");
        
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            string memory name = string(abi.encodePacked("Mock USDC ", _getTokenLetter(i)));
            string memory symbol = string(abi.encodePacked("MUSDC-", _getTokenLetter(i)));
            
            mockTokens[i] = new MockUSDC(name, symbol, 10000);
            
            console.log("Token", i, "deployed:", address(mockTokens[i]));
            console.log("  Name:", name);
            console.log("  Symbol:", symbol);
            console.log("  Initial supply: 10000 tokens");
        }
    }
    
    function _deployPool() internal {
        console.log("\n--- DEPLOYING ORBITAL POOL ---");
        
        // Create IERC20 array from deployed mock tokens
        IERC20[TOKENS_COUNT] memory tokens;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            tokens[i] = IERC20(address(mockTokens[i]));
        }
        
        orbitalPool = new OrbitalPool(tokens, MATH_HELPER);
        
        console.log("OrbitalPool deployed:", address(orbitalPool));
        console.log("Math Helper:", address(orbitalPool.mathHelper()));
        console.log("Tokens Count:", orbitalPool.TOKENS_COUNT());
    }
    
    function _approveTokens() internal {
        console.log("\n--- APPROVING TOKENS ---");
        
        uint256 approveAmount = 5000 * 1e18; // Approve 5000 tokens each
        
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            mockTokens[i].approve(address(orbitalPool), approveAmount);
            console.log("Approved token", i, "amount:", approveAmount / 1e18);
            
            // Verify approval
            uint256 allowance = mockTokens[i].allowance(msg.sender, address(orbitalPool));
            console.log("  Verified allowance:", allowance / 1e18);
        }
    }
    

    function _getTokenLetter(uint256 index) internal pure returns (string memory) {
        if (index == 0) return "A";
        if (index == 1) return "B";
        if (index == 2) return "C";
        if (index == 3) return "D";
        if (index == 4) return "E";
        return "X";
    }
    
    // Utility function to get deployed addresses
    function getDeployedAddresses() external view returns (
        address poolAddress,
        address[TOKENS_COUNT] memory tokenAddresses
    ) {
        poolAddress = address(orbitalPool);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            tokenAddresses[i] = address(mockTokens[i]);
        }
    }
}
