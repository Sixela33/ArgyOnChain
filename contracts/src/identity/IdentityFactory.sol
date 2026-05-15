// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Identity} from "./Identity.sol";

contract IdentityFactory is AccessControl {

    bytes32 public constant IDENTITY_FACTORY_ADMIN = keccak256("IDENTITY_FACTORY_ADMIN");
    address public claimIssuerManager;

    mapping(address => address) public walletToIdentity;

    error InvalidAddress(string message);
    error IdentityAlreadyExists();
    error IdentityNotFound();

    event IdentityCreated(address indexed wallet, address indexed identity);
    event WalletLinked(address indexed wallet, address indexed identity);
    event WalletUnlinked(address indexed wallet, address indexed identity);

    constructor(address _admin, address _claimIssuerManager) {
        if (_admin == address(0)) revert InvalidAddress("Admin cannot be zero address");
        if (_claimIssuerManager == address(0)) revert InvalidAddress("Claim issuer manager cannot be zero address");
        
        claimIssuerManager = _claimIssuerManager;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(IDENTITY_FACTORY_ADMIN, _admin);
    }

    function hasIdentity(address _wallet) public view returns (bool) {
        return walletToIdentity[_wallet] != address(0);
    }

    function createIdentity(address _wallet) external onlyRole(IDENTITY_FACTORY_ADMIN) returns (address) {
        if (_wallet == address(0)) revert InvalidAddress("Invalid wallet address");
        if (hasIdentity(_wallet)) {
            revert IdentityAlreadyExists();
        }

        Identity newIdentity = new Identity(_wallet, claimIssuerManager);
        walletToIdentity[_wallet] = address(newIdentity);
        
        emit IdentityCreated(_wallet, address(newIdentity));
        return address(newIdentity);
    }
    
    function getIdentity(address _wallet) public view returns (address) {
        return walletToIdentity[_wallet];
    }

    function linkWallet(address _identity, address _wallet) external onlyRole(IDENTITY_FACTORY_ADMIN) {
        if (_identity == address(0)) revert InvalidAddress("Invalid identity address");
        if (_wallet == address(0)) revert InvalidAddress("Invalid wallet address");
        if (hasIdentity(_wallet)) {
            revert IdentityAlreadyExists();
        }

        walletToIdentity[_wallet] = _identity;
        emit WalletLinked(_wallet, _identity);
    }

    function unlinkWallet(address _wallet) external onlyRole(IDENTITY_FACTORY_ADMIN) {
        if (_wallet == address(0)) revert InvalidAddress("Invalid wallet address");
        if (!hasIdentity(_wallet)) {
            revert IdentityNotFound();
        }

        address identity = walletToIdentity[_wallet];
        delete walletToIdentity[_wallet];
        emit WalletUnlinked(_wallet, identity);
    }
}