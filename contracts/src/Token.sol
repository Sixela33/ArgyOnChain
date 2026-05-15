// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1363} from "@openzeppelin/contracts/token/ERC20/extensions/ERC1363.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20uRWA} from "@openzeppelin/community-contracts/token/ERC20/extensions/ERC20uRWA.sol";
import {Gorra} from "./identity/Gorra.sol";

/**
 * @title Token
 * Este token es un token compliant con las regulaciones legales para la tokenizacion de activos reales.
 * Este token tiene las siguientes caracteristicas:
 * - Pausable  // El administrador puede pausar y despausar el token
 * - Burnable  // El administrador puede quemar el token de los usuarios
 * - Freezable // El administrador puede congelar y descongelar el token de los usuarios
 * - Managed   // El administrador puede transferir el token de un usuario a otro
 * - Identity  // Solamente los usuarios con una identidad valida pueden tener el token
 */
contract Token is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC1363, ERC20Permit, ERC20uRWA, Gorra {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant FREEZER_ROLE = keccak256("FREEZER_ROLE");
    bytes32 public constant ENFORCER_ROLE = keccak256("ENFORCER_ROLE");

    error InvalidAmount(string message);
    error EmptyString(string message);
    error ArrayTooLarge(string message);

    event TokenMinted(address indexed to, uint256 amount, address indexed minter);
    event TokenBurned(address indexed from, uint256 amount, address indexed burner);

    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin, 
        address enforcer, 
        address _identityFactory, 
        uint256[] memory _requiredClaims        
        )
        ERC20(name, symbol)
        ERC20Permit(name)
        Gorra(_identityFactory, _requiredClaims)
    {
        if (bytes(name).length == 0) revert EmptyString("Token name cannot be empty");
        if (bytes(symbol).length == 0) revert EmptyString("Token symbol cannot be empty");
        if (defaultAdmin == address(0)) revert InvalidAddress("Default admin cannot be zero address");
        if (enforcer == address(0)) revert InvalidAddress("Enforcer cannot be zero address");
        if (_identityFactory == address(0)) revert InvalidAddress("Identity factory cannot be zero address");
        if (_requiredClaims.length > 100) revert ArrayTooLarge("Too many required claims");

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, enforcer);
        _grantRole(MINTER_ROLE, enforcer);
        _grantRole(BURNER_ROLE, enforcer);
        _grantRole(FREEZER_ROLE, enforcer);
        _grantRole(ENFORCER_ROLE, enforcer);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert InvalidAddress("Cannot mint to zero address");
        if (amount == 0) revert InvalidAmount("Cannot mint zero amount");

        _mint(to, amount);
        emit TokenMinted(to, amount, msg.sender);
    }

    function burn(uint256 amount) public override {
        if (amount == 0) revert InvalidAmount("Cannot burn zero amount");
        super.burn(amount);
        emit TokenBurned(msg.sender, amount, msg.sender);
    }

    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        if (account == address(0)) revert InvalidAddress("Cannot burn from zero address");
        if (amount == 0) revert InvalidAmount("Cannot burn zero amount");
        super.burnFrom(account, amount);
        emit TokenBurned(account, amount, msg.sender);
    }

    // Internal functions for the ERC20uRWA extension
    function _checkFreezer(address user, uint256 amount) internal view override onlyRole(FREEZER_ROLE) {}

    function _checkEnforcer(address from, address to, uint256 amount) internal view override onlyRole(ENFORCER_ROLE) {}

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20uRWA, Gorra)
    {
        super._update(from, to, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1363, ERC20uRWA)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
