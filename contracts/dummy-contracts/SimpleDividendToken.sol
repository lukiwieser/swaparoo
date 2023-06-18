// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../DualDividendToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Receives profits in one of two assets, then distributes its profits to the token-holders
// everybody can be token-holder
contract SimpleDividendToken is DualDividendToken {
    constructor(address _tokenA, address _tokenB) DualDividendToken(_tokenA, _tokenB, "DiviToken", "DT") {}

    function receiveProfits(uint amount, address assetAddress) external {
        require(assetAddress == address(tokenA) || assetAddress == address(tokenB), "Asset not supported");
        
        IERC20(assetAddress).transferFrom(msg.sender, address(this), amount);
        
        if(assetAddress == address(tokenA)) {
            distributeDividendsA(amount);
        }
        if(assetAddress == address(tokenB)) {
            distributeDividendsB(amount);
        }
    }

    function mint(uint amount) external {
        _mint(msg.sender, amount);
    }

    function burn(uint amount) external {
        _burn(msg.sender, amount);
    }
}