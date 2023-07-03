// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BRZToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Bronze", "BRZ") {
        _mint(msg.sender, initialSupply);
    }
}