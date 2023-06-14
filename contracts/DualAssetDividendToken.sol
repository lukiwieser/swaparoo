// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// keeps track
// a token that yields dividends.
// there are 2 assets that can be the dividends
// does not handle receiving of assets
// simply call distributeDividendsAsset0() and distributeDividendsAsset0() at the location where dividens are received
// TODO: account for rounding errors
contract DualAssetDividendToken is ERC20 {
    struct Account {
        uint dividendsAsset0;
        uint dividendsAsset1;
        uint lastDividendsAsset0;
        uint lastDividendsAsset1;
    }

    IERC20 immutable asset0;
    IERC20 immutable asset1;
    uint totalDividendsAsset0; // as percentages
    uint totalDividendsAsset1; // as percentages
    mapping(address => Account) accounts;

    constructor(address _asset0, address _asset1, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        asset0 = IERC20(_asset0);
        asset1 = IERC20(_asset1);
    }

    function payoutDividends() external {
        updateDividends(msg.sender);
        uint dividendsAsset0 = accounts[msg.sender].dividendsAsset0;
        uint dividendsAsset1 = accounts[msg.sender].dividendsAsset1;
        accounts[msg.sender].dividendsAsset0 = 0;
        accounts[msg.sender].dividendsAsset1 = 0;
        asset0.transfer(msg.sender, dividendsAsset0);
        asset1.transfer(msg.sender, dividendsAsset1);
    }

    function getAndUpdateDividends() external returns(uint,uint) {
        updateDividends(msg.sender);
        return (accounts[msg.sender].dividendsAsset0, accounts[msg.sender].dividendsAsset1);
    }

    function getDividends() external view returns(uint,uint) {
        return (accounts[msg.sender].dividendsAsset0, accounts[msg.sender].dividendsAsset1);
    }

    function distributeDividendsAsset0(uint amount) internal {
        totalDividendsAsset0 += amount / totalSupply();
    }

    function distributeDividendsAsset1(uint amount) internal {
        totalDividendsAsset1 += amount / totalSupply();
    }

    function updateDividends(address account) internal {
        uint newDividends0 = totalDividendsAsset0 - accounts[account].lastDividendsAsset0;
        uint newDividends1 = totalDividendsAsset1 - accounts[account].lastDividendsAsset1;
        uint owingDividendsAsset0 = balanceOf(account) * newDividends0;
        uint owingDividendsAsset1 = balanceOf(account) * newDividends1;
        if(owingDividendsAsset0 > 0) {
            accounts[account].dividendsAsset0 += owingDividendsAsset0;
            accounts[account].lastDividendsAsset0 = totalDividendsAsset0;
        }
        if(owingDividendsAsset1 > 0) {
            accounts[account].dividendsAsset1 += owingDividendsAsset1;
            accounts[account].lastDividendsAsset1 = totalDividendsAsset1;
        }
    }

    // update dividends if shares of account change
    // Assumption: shares of a accounts token stays the same during adding up their dividends
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if(from != address(0)) {
            updateDividends(from);
        }
        if(to != address(0)) {
            updateDividends(to);
        }
    }
}