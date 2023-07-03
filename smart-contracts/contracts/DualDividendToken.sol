// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


// A ERC20 token that yields dividends in 2 assets.
// dividends can be distributed 2 assets (tokenA & tokenB)
// it does not handle receiving of assets, for this simply call distributeDividendsA() and distributeDividendsB() at the location where dividens are received
// TODO: account for rounding errors
contract DualDividendToken is ERC20 {
    struct Account {
        uint dividendsA;
        uint dividendsB;
        uint lastDividendsA;
        uint lastDividendsB;
    }

    uint constant MULTIPLIER = 10e18;
    IERC20 immutable tokenA;
    IERC20 immutable tokenB;
    uint totalDividendsA; // as percentages
    uint totalDividendsB; // as percentages
    mapping(address => Account) accounts;

    constructor(address _tokenA, address _tokenB, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function payoutDividends() external {
        updateDividends(msg.sender);
        uint dividendsA = accounts[msg.sender].dividendsA;
        uint dividendsB = accounts[msg.sender].dividendsB;
        accounts[msg.sender].dividendsA = 0;
        accounts[msg.sender].dividendsB = 0;
        tokenA.transfer(msg.sender, dividendsA);
        tokenB.transfer(msg.sender, dividendsB);
    }

    function getAndUpdateDividends() external returns(uint, uint) {
        updateDividends(msg.sender);
        return (accounts[msg.sender].dividendsA, accounts[msg.sender].dividendsB);
    }

    function getDividends() external view returns(uint, uint) {
        return (accounts[msg.sender].dividendsA, accounts[msg.sender].dividendsB);
    }

    function distributeDividendsA(uint amount) internal {
        totalDividendsA += (amount * MULTIPLIER) / totalSupply();
    }

    function distributeDividendsB(uint amount) internal {
        totalDividendsB += (amount * MULTIPLIER) / totalSupply();
    }

    function updateDividends(address account) internal {
        uint newDividendsA = totalDividendsA - accounts[account].lastDividendsA;
        uint newDividendsB = totalDividendsB - accounts[account].lastDividendsB;
        uint owingDividendsA = (balanceOf(account) * newDividendsA) / MULTIPLIER;
        uint owingDividendsB = (balanceOf(account) * newDividendsB) / MULTIPLIER;
        if (owingDividendsA > 0) {
            accounts[account].dividendsA += owingDividendsA;
            accounts[account].lastDividendsA = totalDividendsA;
        }
        if (owingDividendsB > 0) {
            accounts[account].dividendsB += owingDividendsB;
            accounts[account].lastDividendsB = totalDividendsB;
        }
    }
	
    // assmuption: shares of a accounts token stays the same during adding up their dividends
    // => update dividends if shares of account change
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if (from != address(0)) {
            updateDividends(from);
        }
        if (to != address(0)) {
            updateDividends(to);
        }
    }
}