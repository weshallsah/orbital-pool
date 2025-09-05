// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import {MyToken as USD1} from "../src/mocks/USD1.sol";
import {MyToken as USD2} from "../src/mocks/USD2.sol";
import {MyToken as USD3} from "../src/mocks/USD3.sol";
import {MyToken as USD4} from "../src/mocks/USD4.sol";
import {MyToken as USD5} from "../src/mocks/USD5.sol";

contract DeployMockUSD is Script {
    function run() external {
        vm.startBroadcast();

        USD1 usd1 = new USD1();
        USD2 usd2 = new USD2();
        USD3 usd3 = new USD3();
        USD4 usd4 = new USD4();
        USD5 usd5 = new USD5();

        console2.log("USD1 deployed at:", address(usd1));
        console2.log("USD2 deployed at:", address(usd2));
        console2.log("USD3 deployed at:", address(usd3));
        console2.log("USD4 deployed at:", address(usd4));
        console2.log("USD5 deployed at:", address(usd5));

        vm.stopBroadcast();
    }
}
