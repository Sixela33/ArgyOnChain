// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IdentityFactory} from "./IdentityFactory.sol";
import {Identity} from "./Identity.sol";

abstract contract Gorra is ERC20, AccessControl {
    IdentityFactory public identityFactory;
    uint256[] public requiredClaims;

    error InvalidAddress(string message);
    error InsufficientPermissions();
    error InvalidArray();

    event RequiredClaimsUpdated(uint256[] oldClaims, uint256[] newClaims);

    constructor(address _identityFactory, uint256[] memory _requiredClaims) {
        if (_identityFactory == address(0)) {
            revert InvalidAddress("Identity factory cannot be zero address");
        }
        if (_requiredClaims.length > 100) {
            revert InvalidArray();
        }
        
        identityFactory = IdentityFactory(_identityFactory);
        requiredClaims = _requiredClaims;
    }

    function setRequiredClaims(uint256[] memory _requiredClaims) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_requiredClaims.length > 100) {
            revert InvalidArray();
        }
        
        uint256[] memory oldClaims = requiredClaims;
        requiredClaims = _requiredClaims;
        
        emit RequiredClaimsUpdated(oldClaims, _requiredClaims);
    }

    function _hasRequiredClaims(address wallet) internal view returns (bool) {
        address identityAddress = identityFactory.getIdentity(wallet);
        if (identityAddress == address(0)) return false;
        
        Identity identity = Identity(identityAddress);
        
        for (uint256 i = 0; i < requiredClaims.length;) {
            if (!identity.hasClaim(requiredClaims[i])) {
                return false;
            }
            unchecked {
                ++i;
            }
        }
        return true;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20) {
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0)) {
            address fromIdentity = identityFactory.getIdentity(from);
            if (fromIdentity == address(0)) {
                revert InvalidAddress("Sender has no identity");
            }
            if (!_hasRequiredClaims(from)) {
                revert InsufficientPermissions();
            }
        }
        
        if (to != address(0)) {
            address toIdentity = identityFactory.getIdentity(to);
            if (toIdentity == address(0)) {
                revert InvalidAddress("Recipient has no identity");
            }
            if (!_hasRequiredClaims(to)) {
                revert InsufficientPermissions();
            }
        }

        // Update the balances
        super._update(from, to, value);
    }

    function getRequiredClaims() external view returns (uint256[] memory) {
        return requiredClaims;
    }

    function hasRequiredClaims(address wallet) external view returns (bool) {
        return _hasRequiredClaims(wallet);
    }
}