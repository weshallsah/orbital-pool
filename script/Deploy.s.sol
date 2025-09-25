// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {OrbitalHelper} from "../src/ys.sol";
import {OrbitalFactory} from "../src/OrbitalFactory.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Simple ERC20 mock for testing
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}

contract DeployScript is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy mock tokens
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 1000000);
        MockERC20 usdt = new MockERC20("Tether USD", "USDT", 1000000);
        MockERC20 dai = new MockERC20("Dai Stablecoin", "DAI", 1000000);

        console.log("USDC deployed at:", address(usdc));
        console.log("USDT deployed at:", address(usdt));
        console.log("DAI deployed at:", address(dai));

        // Deploy OrbitalHelper (math helper)
        OrbitalHelper helper = new OrbitalHelper();
        console.log("OrbitalHelper deployed at:", address(helper));

        // Deploy OrbitalFactory with helper address
        OrbitalFactory factory = new OrbitalFactory(address(helper));
        console.log("OrbitalFactory deployed at:", address(factory));

        // Create a pool with the mock tokens
        IERC20[] memory tokens = new IERC20[](3);
        tokens[0] = usdc;
        tokens[1] = usdt;
        tokens[2] = dai;

        address pool = factory.createPool(tokens);
        console.log("OrbitalPool deployed at:", pool);

        // Stop broadcasting
        vm.stopBroadcast();
    }
}