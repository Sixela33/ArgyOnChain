// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IIdentity {
    error InvalidClaimIssuer();
    error InvalidAddress(string message);
    error InvalidClaim();
    error ClaimNotFound();
    error ArrayTooLarge();

    event ClaimAdded(uint256 indexed claim, address indexed issuer);
    event ClaimRemoved(uint256 indexed claim, address indexed issuer);

    function addClaim(uint256 _claim) external;
    function removeClaim(uint256 _claim) external;
    function hasClaim(uint256 _claim) external view returns (bool);
}