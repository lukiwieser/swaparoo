// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// keeps track
// a token that yields dividends.
// there are 2 assets that can be the dividends
contract DualAssetDividendToken is ERC20 {
    struct Account {
        uint dividendsAsset0;
        uint lastDividendsAsset0;
        uint dividendsAsset1;
        uint lastDividendsAsset1;
    }

    uint totalDividendsAsset0; // as percentages
    uint totalDividendsAsset1; // as percentages
    mapping(address => Account) accounts;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function updateDividends(address account) internal {
        uint newDividends0 = totalDividendsAsset0 - accounts[account].lastDividendsAsset0;
        uint newDividends1 = totalDividendsAsset1 - accounts[account].lastDividendsAsset1;
        uint owingDividendsAsset0 = balanceOf(account) * newDividends0;
        uint owingDividendsAsset1 = balanceOf(account) * newDividends1;
        if(owingDividendsAsset0 > 0) {
            accounts[account].dividendsAsset0 += owingDividendsAsset0;
            accounts[account].lastDividendsAsset1 = totalDividendsAsset0;
        }
        if(owingDividendsAsset1 > 0) {
            accounts[account].dividendsAsset1 += owingDividendsAsset1;
            accounts[account].lastDividendsAsset1 = totalDividendsAsset1;
        }
    }

    function distributeDividendsAsset0(uint amount) internal {
        totalDividendsAsset0 += amount / totalSupply();
    }

    function distributeDividendsAsset1(uint amount) internal {
        totalDividendsAsset1 += amount / totalSupply();
    }

    // update dividends if shares of account change
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if(from != address(0)) {
            updateDividends(from);
        }
        if(to != address(0)) {
            updateDividends(to);
        }
    }

    // TODO: payout
}