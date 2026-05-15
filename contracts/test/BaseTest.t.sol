// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ClaimIssuerManager} from "../src/identity/ClaimIssuerManager.sol";
import {IdentityFactory} from "../src/identity/IdentityFactory.sol";
import {Identity} from "../src/identity/Identity.sol";
import {TokenFactory} from "../src/factories/TokenFactory.sol";
import {Token} from "../src/Token.sol";

abstract contract BaseTest is Test {
    uint256 internal constant CLAIM_KYC = 1;

    address internal admin = makeAddr("admin");
    address internal enforcer = makeAddr("enforcer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal charlie = makeAddr("charlie");

    ClaimIssuerManager internal claimIssuerManager;
    IdentityFactory internal identityFactory;
    TokenFactory internal tokenFactory;
    Token internal token;

    function setUp() public virtual {
        claimIssuerManager = new ClaimIssuerManager(admin);

        vm.startPrank(admin);
        identityFactory = new IdentityFactory(admin, address(claimIssuerManager));
        vm.stopPrank();

        vm.prank(admin);
        tokenFactory = new TokenFactory(address(identityFactory));

        vm.startPrank(admin);
        claimIssuerManager.addTokenFactory(address(tokenFactory));
        identityFactory.grantRole(identityFactory.IDENTITY_FACTORY_ADMIN(), address(tokenFactory));

        uint256[] memory issuerClaims = new uint256[](1);
        issuerClaims[0] = CLAIM_KYC;
        claimIssuerManager.addClaimIssuer(admin, issuerClaims);
        vm.stopPrank();

        uint256[] memory requiredClaims = new uint256[](1);
        requiredClaims[0] = CLAIM_KYC;
        vm.prank(admin);
        token = new Token("RWA Token", "RWA", admin, enforcer, address(identityFactory), requiredClaims);
    }

    function _setupIdentityWithClaim(address wallet) internal returns (address identityAddr) {
        vm.prank(admin);
        identityAddr = identityFactory.createIdentity(wallet);
        vm.prank(admin);
        Identity(identityAddr).addClaim(CLAIM_KYC);
    }
}
