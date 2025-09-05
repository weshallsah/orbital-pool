// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("USD Token 5", "USD5") {
        _mint(msg.sender, 10_000 * 10 ** uint256(decimals()));
    }
}
