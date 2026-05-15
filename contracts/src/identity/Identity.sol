// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ClaimIssuerManager} from "./ClaimIssuerManager.sol";
import {IIdentity} from "../interfaces/IIdentity.sol";

contract Identity is IIdentity, AccessControl {
    bytes32 public constant IDENTITY_ADMIN = keccak256("IDENTITY_ADMIN");

    ClaimIssuerManager public claimIssuerManager;
    mapping(uint256 => bool) public claims;

    constructor(address _admin, address _claimIssuerManager) {
        if (_admin == address(0)) revert InvalidAddress("Admin cannot be zero address");
        if (_claimIssuerManager == address(0)) revert InvalidAddress("Claim issuer manager cannot be zero address");
        
        claimIssuerManager = ClaimIssuerManager(_claimIssuerManager);
        _grantRole(IDENTITY_ADMIN, _admin);
    }

    // Only valid claim issuers can issue claims on this identity
    function addClaim(uint256 _claim) external {
        if (!claimIssuerManager.isValidClaim(msg.sender, _claim)) {
            revert InvalidClaimIssuer();
        }

        claims[_claim] = true;
        emit ClaimAdded(_claim, msg.sender);
    }

    // Only valid claim issuers can remove claims from this identity
    function removeClaim(uint256 _claim) external {        
        if (!claimIssuerManager.isValidClaim(msg.sender, _claim)) {
            revert InvalidClaimIssuer();
        }

        claims[_claim] = false;
        
        emit ClaimRemoved(_claim, msg.sender);
    }

    function hasClaim(uint256 _claim) external view returns (bool) {
        return claims[_claim];
    }
}