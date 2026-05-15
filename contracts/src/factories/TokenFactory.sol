// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Token} from "../Token.sol";
import {IdentityFactory} from "../identity/IdentityFactory.sol";

contract TokenFactory is AccessControl {
    bytes32 public constant FACTORY_ADMIN_ROLE = keccak256("FACTORY_ADMIN_ROLE");
    address public identityFactory;

    event TokenCreated(address indexed token, address indexed defaultAdmin, string name, string symbol, uint256[] requiredClaims, uint256 initialSupply);
    event IdentityFactoryUpdated(address indexed oldFactory, address indexed newFactory);

    constructor(address _identityFactory) {
        if (_identityFactory == address(0)) revert InvalidAddress("Identity factory cannot be zero address");
        identityFactory = _identityFactory;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FACTORY_ADMIN_ROLE, msg.sender);
    }

    error InvalidAddress(string message);
    error EmptyString();
    error InvalidAmount();
    error ArrayTooLarge();
    error InvalidArrayLength();

    function deployToken(
        string memory name,
        string memory symbol,
        address _defaultAdmin,
        address _enforcer,
        uint256[] memory _requiredClaims
    ) external onlyRole(FACTORY_ADMIN_ROLE) returns (address) {
        if (bytes(name).length == 0) revert EmptyString();
        if (bytes(symbol).length == 0) revert EmptyString();
        if (_requiredClaims.length > 100) revert ArrayTooLarge();
        if (_enforcer == address(0)) revert InvalidAddress("Enforcer cannot be zero address");
    

        if (_defaultAdmin == address(0)) {
            _defaultAdmin = msg.sender;
        }

        address token = address(new Token(name, symbol, address(this), _enforcer, identityFactory, _requiredClaims));
        Token(token).grantRole(Token(token).DEFAULT_ADMIN_ROLE(), _defaultAdmin);

        emit TokenCreated(token, _defaultAdmin, name, symbol, _requiredClaims, 0);
        return token;
    }

    function updateIdentityFactory(address _newIdentityFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newIdentityFactory == address(0)) revert InvalidAddress("New identity factory cannot be zero address");
        if (_newIdentityFactory == identityFactory) revert InvalidAddress("New factory same as current");
        
        address oldFactory = identityFactory;
        identityFactory = _newIdentityFactory;
        emit IdentityFactoryUpdated(oldFactory, _newIdentityFactory);
    }
}