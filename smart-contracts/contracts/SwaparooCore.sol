// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SwaparooPool.sol";

/// @title Core contract of Swaparoo
/// @notice Manages all pools (SwaparooPools) and owners
/// @dev Pools are stored in an array (for efficently access to all pools), and in a map (for efficently acces by token-addresses, and for duplicates)
contract SwaparooCore is AccessControlEnumerable {
    bytes32 public constant ROLE_OWNER = keccak256("OWNER");
    mapping (address => mapping (address => address)) internal poolsMap; // (tokenA,tokenB) => pool
    address[] internal poolsArray;

    event OwnerAdded(address account);
    event OwnerRemoved(address account);
    event PoolAdded(address pool, address tokenA, address tokenB);

    constructor() {
        _grantRole(ROLE_OWNER, msg.sender);
    }

    modifier onlyRoleOwner() {
        require(this.isOwner(msg.sender), "unauthorized");
        _;
    }

    /// @notice Retrieves all pools in the SwaparooCore
    function getPools() external view returns(address[] memory) {
        return poolsArray;
    }

    /// @notice Retrieves the pool address associated with the specified tokens
    function getPoolByTokens(address tokenA, address tokenB) external view returns(address) {
        return poolsMap[tokenA][tokenB];
    }

    /// @notice Checks if the given account is an owner
    function isOwner(address account) external view returns (bool) {
        return hasRole(ROLE_OWNER, account);
    }

    /// @notice Adds an account as an owner
    function addOwner(address account) external onlyRoleOwner {
        _grantRole(ROLE_OWNER, account);
        emit OwnerAdded(account);
    }

    /// @notice Allows an owner to renounce their ownership
    function renounceOwner() external onlyRoleOwner {
        require(getRoleMemberCount(ROLE_OWNER) > 1, "only-owner");
        _revokeRole(ROLE_OWNER, msg.sender);
        emit OwnerRemoved(msg.sender);
    }

    /// @notice Creates a new Swaparoo Pool, for the given tokens. Only one pool can exist for a token pair
    function createPool(address tokenA, address tokenB) external onlyRoleOwner {
        require(poolsMap[tokenA][tokenB] == address(0) && poolsMap[tokenB][tokenA] == address(0), "already-exists");

        SwaparooPool pool = new SwaparooPool(tokenA, tokenB, "Swaparoo Liquidity Token", "LP");
        poolsMap[tokenA][tokenB] = address(pool);
        poolsArray.push(address(pool));

        emit PoolAdded(address(pool), tokenA, tokenB);
    }
}
