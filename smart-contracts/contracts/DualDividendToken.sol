// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title A ERC20 token that yields dividends in 2 assets
/// @notice Dividends can be distributed 2 assets (tokenA & tokenB) to users, proportional to their balance
/// @dev This contract does not handle receiving of assets! 
/// To distribute dividends, call distributeDividendsA() or distributeDividendsB() at the location where dividends are received.
/// 
/// HOW DIVIDENDS ARE STORED:
///
/// The dividends of a single user can be represented as a running sum:
/// D_1 * (TS_1 / B_1) + ... + D_n * (TS_n * B_n)
/// 
/// - D_n: The nth received dividend.
/// - B_n: The user's balance of DualDividendToken at the time of receiving dividend n.
/// - TS_n: The total supply of DualDividendToken at the time of receiving dividend n.
/// 
/// If we assume that the balance B_n stays the same during the receiving of tokens, the formula simplifies to:
/// [(D_1 / TS_1) + ... + (D_n / TS_n)] * B
/// 
/// Now we can simply save the dividend percentages (D_1 / TS_1).
/// 
/// If we want to calculate a user's dividends, we use the formula: 
/// (totalDividend - lastDividend) * B
/// 
/// - totalDividend: All dividends received so far: (D_1 / TS_1) + ...+ (D_n / TS_n).
/// - lastDividend: The dividends where the user last paid out.
/// 
/// TODO: The contract does not account for lost tokens due to rounding
contract DualDividendToken is ERC20 {
    struct Account {
        uint dividendsA;
        uint dividendsB;
        uint lastDividendsA;
        uint lastDividendsB;
    }

    uint constant public MULTIPLIER = 10e18;
    IERC20 immutable internal tokenA;
    IERC20 immutable internal tokenB;
    uint internal totalDividendsA; // as percentages
    uint internal totalDividendsB; // as percentages
    mapping(address => Account) internal accounts;

    constructor(address _tokenA, address _tokenB, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice Pays out the dividends to the caller's address
    function payoutDividends() external {
        updateDividends(msg.sender);
        uint dividendsA = accounts[msg.sender].dividendsA;
        uint dividendsB = accounts[msg.sender].dividendsB;
        accounts[msg.sender].dividendsA = 0;
        accounts[msg.sender].dividendsB = 0;
        tokenA.transfer(msg.sender, dividendsA);
        tokenB.transfer(msg.sender, dividendsB);
    }

    /// @notice Updates and then returns the dividends in tokenA and tokenB for the caller's address
    /// Always returns the latest amount of dividends of the caller.
    function getAndUpdateDividends() external returns(uint, uint) {
        updateDividends(msg.sender);
        return (accounts[msg.sender].dividendsA, accounts[msg.sender].dividendsB);
    }  

    /// @notice Returns the dividends in tokenA and tokenB for the caller's address. 
    /// Important: Might return outdated values, since dividends are not updated, when calling this function.
    function getDividends() external view returns(uint, uint) {
        return (accounts[msg.sender].dividendsA, accounts[msg.sender].dividendsB);
    }

    /// @dev Distributes dividends in tokenA based on the specified amount.
    /// Assumes the caller has already transferred the tokenA to this contract.
    function distributeDividendsA(uint amount) internal {
        totalDividendsA += (amount * MULTIPLIER) / totalSupply();
    }

    /// @dev Distributes dividends in tokenB based on the specified amount.
    /// Assumes the caller has already transferred the tokenB to this contract.
    function distributeDividendsB(uint amount) internal {
        totalDividendsB += (amount * MULTIPLIER) / totalSupply();
    }

    /// @dev Updates the dividends for the specified account.
    /// Instead of updating all the users dividends directly when receiving dividends e.g. in distributeDividendsA(), 
    /// we calculate a user’s dividends in hindsight, thus reducing the amount of work/gas used when distributing dividends.
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

    /// @dev update dividends if shares of account change, due to the assumption that balance of a user stays the same during adding up their dividends
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