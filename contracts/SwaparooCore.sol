// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract SwaparooCore is AccessControlEnumerable {
    bytes32 public constant ROLE_OWNER = keccak256("OWNER");
    
    event OwnerAdded(address account);
    event OwnerRemoved(address account);

    constructor() {
        _grantRole(ROLE_OWNER, msg.sender);
    }

    modifier onlyRoleOwner() {
        require(this.isOwner(msg.sender), "Caller is not a owner");
        _;
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
}
