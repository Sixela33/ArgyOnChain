// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ClaimIssuerManager is AccessControl {
    bytes32 public constant CLAIM_ISSUER_ADMIN = keccak256("CLAIM_ISSUER_ADMIN");
    bytes32 public constant CLAIM_ISSUER_ROLE = keccak256("CLAIM_ISSUER_ROLE");

    mapping(address => mapping(uint256 => bool)) public possibleClaims;
    mapping(address => bool) public activeClaimIssuers;
    mapping(address => bool) public isTokenFactory;
    address[] public tokenFactories;

    error InvalidAddress(string message);
    error InvalidArray();
    error IssuerNotActive();
    error IssuerAlreadyActive();
    error TokenFactoryAlreadyAdded();
    error TokenFactoryNotAdded();

    event TokenFactoryAdded(address indexed tokenFactory);
    event TokenFactoryRemoved(address indexed tokenFactory);
    event ClaimIssuerAdded(address indexed issuer, uint256[] possibleClaims);
    event ClaimIssuerRemoved(address indexed issuer);
    event ClaimIssuerStatusChanged(address indexed issuer, bool active);

    event ClaimAddedToIssuer(address indexed issuer, uint256 claim);
    event ClaimRemovedFromIssuer(address indexed issuer, uint256 claim);
    event ClaimsAddedToIssuer(address indexed issuer, uint256[] claims);
    event ClaimsRemovedFromIssuer(address indexed issuer, uint256[] claims);

    constructor(address _admin) {
        if (_admin == address(0)) revert InvalidAddress("Admin cannot be zero address");
        _grantRole(CLAIM_ISSUER_ADMIN, _admin);
        _grantRole(CLAIM_ISSUER_ROLE, _admin);
    }

    function addClaimIssuer(address _issuer, uint256[] calldata _possibleClaims) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");
        if (_possibleClaims.length == 0) revert InvalidArray();

        activeClaimIssuers[_issuer] = true;

        for (uint256 i = 0; i < _possibleClaims.length;) {
            possibleClaims[_issuer][_possibleClaims[i]] = true;
            unchecked {
                ++i;
            }
        }

        emit ClaimIssuerAdded(_issuer, _possibleClaims);
    }

    function removeClaimIssuer(address _issuer) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");

        activeClaimIssuers[_issuer] = false;
        emit ClaimIssuerRemoved(_issuer);
    }

    function addClaimToIssuer(address _issuer, uint256 _claim) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");
        
        possibleClaims[_issuer][_claim] = true;
        emit ClaimAddedToIssuer(_issuer, _claim);
    }

    function removeClaimFromIssuer(address _issuer, uint256 _claim) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");
        
        possibleClaims[_issuer][_claim] = false;
        emit ClaimRemovedFromIssuer(_issuer, _claim);
    }

    function batchAddClaimToIssuer(address _issuer, uint256[] calldata _claims) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");
        if (_claims.length == 0) revert InvalidArray();

        for (uint256 i = 0; i < _claims.length;) {
            possibleClaims[_issuer][_claims[i]] = true;
            unchecked {
                ++i;
            }
        }

        emit ClaimsAddedToIssuer(_issuer, _claims);
    }

    function batchRemoveClaimFromIssuer(address _issuer, uint256[] calldata _claims) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_issuer == address(0)) revert InvalidAddress("Issuer cannot be zero address");
        if (_claims.length == 0) revert InvalidArray();

        for (uint256 i = 0; i < _claims.length;) {
            possibleClaims[_issuer][_claims[i]] = false;
            unchecked {
                ++i;
            }
        }

        emit ClaimsRemovedFromIssuer(_issuer, _claims);
    }

    function addTokenFactory(address _tokenFactory) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_tokenFactory == address(0)) revert InvalidAddress("Token factory cannot be zero address");
        if (isTokenFactory[_tokenFactory]) revert TokenFactoryAlreadyAdded();
        isTokenFactory[_tokenFactory] = true;
        tokenFactories.push(_tokenFactory);
        emit TokenFactoryAdded(_tokenFactory);
    }

    function removeTokenFactory(address _tokenFactory) external onlyRole(CLAIM_ISSUER_ADMIN) {
        if (_tokenFactory == address(0)) revert InvalidAddress("Token factory cannot be zero address");
        if (!isTokenFactory[_tokenFactory]) revert TokenFactoryNotAdded();
        isTokenFactory[_tokenFactory] = false;
        for (uint256 i = 0; i < tokenFactories.length;) {
            if (tokenFactories[i] == _tokenFactory) {                
                tokenFactories[i] = tokenFactories[tokenFactories.length - 1];
                tokenFactories.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }
        emit TokenFactoryRemoved(_tokenFactory);
    }

    function getTokenFactories() external view returns (address[] memory) {
        return tokenFactories;
    }
    
    function isValidClaim(address _issuer, uint256 _claim) external view returns (bool) {
        return isTokenFactory[_issuer] || (activeClaimIssuers[_issuer] && possibleClaims[_issuer][_claim]);
    }
}