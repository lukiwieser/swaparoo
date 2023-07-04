// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SwaparooPool.sol";

contract SwaparooCore is AccessControlEnumerable {
    bytes32 public constant ROLE_OWNER = keccak256("OWNER");
    mapping (address => mapping (address => address)) poolsMap; // (tokenA,tokenB) => pool
    // Todo: change to (address,address) => SwaparooPool
    address[] public poolsArray;

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

    function getPools() external view returns(address[] memory) {
        return poolsArray;
    }

    function getPoolByTokens(address tokenA, address tokenB) external view returns(address) {
        return poolsMap[tokenA][tokenB];
    }

    function isOwner(address account) external view returns (bool) {
        return hasRole(ROLE_OWNER, account);
    }

    function addOwner(address account) external onlyRoleOwner {
        _grantRole(ROLE_OWNER, account);
        emit OwnerAdded(account);
    }

    function renounceOwner() external onlyRoleOwner {
        require(getRoleMemberCount(ROLE_OWNER) > 1, "only-owner");
        _revokeRole(ROLE_OWNER, msg.sender);
        emit OwnerRemoved(msg.sender);
    }

    function createPool(address tokenA, address tokenB) external onlyRoleOwner {
        require(poolsMap[tokenA][tokenB] == address(0) && poolsMap[tokenB][tokenA] == address(0), "already-exists");

        SwaparooPool pool = new SwaparooPool(tokenA, tokenB, "Swaparoo Liquidity Token", "LP");
        poolsMap[tokenA][tokenB] = address(pool);
        poolsArray.push(address(pool));

        emit PoolAdded(address(pool), tokenA, tokenB);
    }
}
