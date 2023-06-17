// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../DualAssetDividendToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Receives profits in one of two assets, then distributes its profits to the token-holders
// everybody can be token-holder
contract SimpleDividendToken is DualAssetDividendToken {
    constructor(address _asset0, address _asset1) DualAssetDividendToken(_asset0, _asset1, "DiviToken", "DT") {}

    function receiveProfits(uint amount, address assetAddress) external {
        require(assetAddress == address(asset0) || assetAddress == address(asset1), "Asset not supported");
        
        IERC20(assetAddress).transferFrom(msg.sender, address(this), amount);
        
        if(assetAddress == address(asset0)) {
            distributeDividendsAsset0(amount);
        }
        if(assetAddress == address(asset1)) {
            distributeDividendsAsset1(amount);
        }
    }

    function mint(uint amount) external {
        _mint(msg.sender, amount);
    }

    function burn(uint amount) external {
        _burn(msg.sender, amount);
    }
}