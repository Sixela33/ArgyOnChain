// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {BaseTest} from "./BaseTest.t.sol";
import {ClaimIssuerManager} from "../src/identity/ClaimIssuerManager.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract ClaimIssuerManagerTest is BaseTest {
    address internal issuer = makeAddr("issuer");
    address internal factory2 = makeAddr("factory2");

    uint256[] internal singleClaim;
    uint256[] internal multiClaims;

    function setUp() public override {
        super.setUp();
        singleClaim = new uint256[](1);
        singleClaim[0] = 42;

        multiClaims = new uint256[](3);
        multiClaims[0] = 10;
        multiClaims[1] = 20;
        multiClaims[2] = 30;
    }

    // --- addClaimIssuer ---

    function test_addClaimIssuer() public {
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);

        assertTrue(claimIssuerManager.activeClaimIssuers(issuer));
        assertTrue(claimIssuerManager.isValidClaim(issuer, 42));
    }

    function test_addClaimIssuer_emitsEvent() public {
        vm.expectEmit(true, false, false, true, address(claimIssuerManager));
        emit ClaimIssuerManager.ClaimIssuerAdded(issuer, singleClaim);
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
    }

    function test_addClaimIssuer_revertsIfNotAdmin() public {
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            claimIssuerManager.CLAIM_ISSUER_ADMIN()
        ));
        vm.prank(alice);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
    }

    function test_addClaimIssuer_revertsIfZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(
            ClaimIssuerManager.InvalidAddress.selector,
            "Issuer cannot be zero address"
        ));
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(address(0), singleClaim);
    }

    function test_addClaimIssuer_revertsIfEmptyArray() public {
        uint256[] memory empty = new uint256[](0);
        vm.expectRevert(ClaimIssuerManager.InvalidArray.selector);
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, empty);
    }

    // --- removeClaimIssuer ---

    function test_removeClaimIssuer() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
        claimIssuerManager.removeClaimIssuer(issuer);
        vm.stopPrank();

        assertFalse(claimIssuerManager.activeClaimIssuers(issuer));
        assertFalse(claimIssuerManager.isValidClaim(issuer, 42));
    }

    function test_removeClaimIssuer_emitsEvent() public {
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);

        vm.expectEmit(true, false, false, false, address(claimIssuerManager));
        emit ClaimIssuerManager.ClaimIssuerRemoved(issuer);
        vm.prank(admin);
        claimIssuerManager.removeClaimIssuer(issuer);
    }

    function test_removeClaimIssuer_revertsIfNotAdmin() public {
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            claimIssuerManager.CLAIM_ISSUER_ADMIN()
        ));
        vm.prank(alice);
        claimIssuerManager.removeClaimIssuer(issuer);
    }

    // --- addClaimToIssuer / removeClaimFromIssuer ---

    function test_addClaimToIssuer() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
        claimIssuerManager.addClaimToIssuer(issuer, 99);
        vm.stopPrank();

        assertTrue(claimIssuerManager.possibleClaims(issuer, 99));
    }

    function test_removeClaimFromIssuer() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
        claimIssuerManager.removeClaimFromIssuer(issuer, 42);
        vm.stopPrank();

        assertFalse(claimIssuerManager.possibleClaims(issuer, 42));
    }

    // --- batchAddClaimToIssuer / batchRemoveClaimFromIssuer ---

    function test_batchAddClaimToIssuer() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
        claimIssuerManager.batchAddClaimToIssuer(issuer, multiClaims);
        vm.stopPrank();

        assertTrue(claimIssuerManager.possibleClaims(issuer, 10));
        assertTrue(claimIssuerManager.possibleClaims(issuer, 20));
        assertTrue(claimIssuerManager.possibleClaims(issuer, 30));
    }

    function test_batchAddClaimToIssuer_revertsIfEmptyArray() public {
        uint256[] memory empty = new uint256[](0);
        vm.expectRevert(ClaimIssuerManager.InvalidArray.selector);
        vm.prank(admin);
        claimIssuerManager.batchAddClaimToIssuer(issuer, empty);
    }

    function test_batchRemoveClaimFromIssuer() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, multiClaims);
        claimIssuerManager.batchRemoveClaimFromIssuer(issuer, multiClaims);
        vm.stopPrank();

        assertFalse(claimIssuerManager.possibleClaims(issuer, 10));
        assertFalse(claimIssuerManager.possibleClaims(issuer, 20));
        assertFalse(claimIssuerManager.possibleClaims(issuer, 30));
    }

    function test_batchRemoveClaimFromIssuer_revertsIfEmptyArray() public {
        uint256[] memory empty = new uint256[](0);
        vm.expectRevert(ClaimIssuerManager.InvalidArray.selector);
        vm.prank(admin);
        claimIssuerManager.batchRemoveClaimFromIssuer(issuer, empty);
    }

    // --- addTokenFactory / removeTokenFactory ---

    function test_addTokenFactory() public {
        vm.prank(admin);
        claimIssuerManager.addTokenFactory(factory2);

        assertTrue(claimIssuerManager.isTokenFactory(factory2));
    }

    function test_addTokenFactory_emitsEvent() public {
        vm.expectEmit(true, false, false, false, address(claimIssuerManager));
        emit ClaimIssuerManager.TokenFactoryAdded(factory2);
        vm.prank(admin);
        claimIssuerManager.addTokenFactory(factory2);
    }

    function test_addTokenFactory_revertsIfDuplicate() public {
        vm.startPrank(admin);
        claimIssuerManager.addTokenFactory(factory2);
        vm.expectRevert(ClaimIssuerManager.TokenFactoryAlreadyAdded.selector);
        claimIssuerManager.addTokenFactory(factory2);
        vm.stopPrank();
    }

    function test_removeTokenFactory() public {
        vm.startPrank(admin);
        claimIssuerManager.addTokenFactory(factory2);
        claimIssuerManager.removeTokenFactory(factory2);
        vm.stopPrank();

        assertFalse(claimIssuerManager.isTokenFactory(factory2));
    }

    function test_removeTokenFactory_revertsIfNotAdded() public {
        vm.expectRevert(ClaimIssuerManager.TokenFactoryNotAdded.selector);
        vm.prank(admin);
        claimIssuerManager.removeTokenFactory(factory2);
    }

    function test_getTokenFactories() public view {
        address[] memory factories = claimIssuerManager.getTokenFactories();
        assertEq(factories.length, 1);
        assertEq(factories[0], address(tokenFactory));
    }

    // --- isValidClaim ---

    function test_isValidClaim_tokenFactoryAlwaysValid() public view {
        // Token factory is trusted for any claim ID, no need to be an active issuer
        assertTrue(claimIssuerManager.isValidClaim(address(tokenFactory), 9999));
    }

    function test_isValidClaim_activeIssuerWithClaim() public {
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);

        assertTrue(claimIssuerManager.isValidClaim(issuer, 42));
    }

    function test_isValidClaim_inactiveIssuerReturnsFalse() public {
        vm.startPrank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);
        claimIssuerManager.removeClaimIssuer(issuer);
        vm.stopPrank();

        assertFalse(claimIssuerManager.isValidClaim(issuer, 42));
    }

    function test_isValidClaim_wrongClaimReturnsFalse() public {
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(issuer, singleClaim);

        assertFalse(claimIssuerManager.isValidClaim(issuer, 9999));
    }

    function test_isValidClaim_unknownIssuerReturnsFalse() public view {
        assertFalse(claimIssuerManager.isValidClaim(alice, 42));
    }
}
