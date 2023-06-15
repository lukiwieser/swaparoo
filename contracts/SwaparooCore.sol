// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SwaparooPool.sol";

contract SwaparooCore is AccessControlEnumerable {
    bytes32 public constant ROLE_OWNER = keccak256("OWNER");
    mapping (address => mapping (address => address)) pools; // (tokenA,tokenB) => pool
    // Todo: change to (address,address) => SwaparooPool
    address[] poolsArray;

    event OwnerAdded(address account);
    event OwnerRemoved(address account);
    event PoolAdded(address pool, address tokenA, address tokenB);
    event PoolRemoved(address pool, address tokenA, address tokenB);

    constructor() {
        _grantRole(ROLE_OWNER, msg.sender);
    }

    modifier onlyRoleOwner() {
        require(this.isOwner(msg.sender), "Caller is not a owner");
        _;
    }

    function getPools() external view returns(address[] memory) {
        return poolsArray;
    }

    function isOwner(address account) external view returns (bool) {
        return hasRole(ROLE_OWNER, account);
    }

    function addOwner(address account) external onlyRoleOwner {
        _grantRole(ROLE_OWNER, account);
        emit OwnerAdded(account);
    }

    function renounceOwner() external onlyRoleOwner {
        require(getRoleMemberCount(ROLE_OWNER) > 1, "Cannot renounce owner if they are the only owner");
        _revokeRole(ROLE_OWNER, msg.sender);
        emit OwnerRemoved(msg.sender);
    }

    function createPool(address tokenA, address tokenB) external onlyRoleOwner {
        require(pools[tokenA][tokenB] == address(0) && pools[tokenB][tokenA] == address(0), "Only one pool can exist for a token-pair");

        SwaparooPool pool = new SwaparooPool(tokenA, tokenB, "LP", "LP");
        pools[tokenA][tokenB] = address(pool);
        poolsArray.push(address(pool));

        emit PoolAdded(address(pool), tokenA, tokenB);
    }

    function removePool(address tokenA, address tokenB) external onlyRoleOwner {
        // TODO: check if exits
        // find index of poolsArray
        address poolAddress = pools[tokenA][tokenB];
        uint poolIndex = 0;
        for(uint i = 0; i < poolsArray.length; i++) {
            if(poolsArray[i] == poolAddress) {
                poolIndex = i;
                break;
            }
        }
        // delete from array & mapping
        poolsArray[poolIndex] = poolsArray[poolsArray.length-1];
        poolsArray.pop();
        delete pools[tokenA][tokenB];

        emit PoolRemoved(poolAddress, tokenA, tokenB);
    }
}
