// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ClaimIssuerManager} from "../src/identity/ClaimIssuerManager.sol";
import {Identity} from "../src/identity/Identity.sol";
import {IIdentity} from "../src/interfaces/IIdentity.sol";

contract IdentityTest is Test {
    uint256 internal constant CLAIM_KYC = 1;
    uint256 internal constant CLAIM_AML = 2;

    address internal admin = makeAddr("admin");
    address internal wallet = makeAddr("wallet");
    address internal unauthorizedIssuer = makeAddr("unauthorizedIssuer");

    ClaimIssuerManager internal claimIssuerManager;
    Identity internal identity;

    function setUp() public {
        claimIssuerManager = new ClaimIssuerManager(admin);

        uint256[] memory claims = new uint256[](2);
        claims[0] = CLAIM_KYC;
        claims[1] = CLAIM_AML;
        vm.prank(admin);
        claimIssuerManager.addClaimIssuer(admin, claims);

        identity = new Identity(wallet, address(claimIssuerManager));
    }

    // --- addClaim ---

    function test_addClaim() public {
        vm.prank(admin);
        identity.addClaim(CLAIM_KYC);

        assertTrue(identity.hasClaim(CLAIM_KYC));
    }

    function test_addClaim_emitsEvent() public {
        vm.expectEmit(true, true, false, false, address(identity));
        emit IIdentity.ClaimAdded(CLAIM_KYC, admin);
        vm.prank(admin);
        identity.addClaim(CLAIM_KYC);
    }

    function test_addClaim_revertsIfInvalidIssuer() public {
        vm.expectRevert(IIdentity.InvalidClaimIssuer.selector);
        vm.prank(unauthorizedIssuer);
        identity.addClaim(CLAIM_KYC);
    }

    function test_addClaim_revertsIfIssuerNotAuthorizedForClaim() public {
        // admin is authorized for CLAIM_KYC and CLAIM_AML, but not claim 99
        vm.expectRevert(IIdentity.InvalidClaimIssuer.selector);
        vm.prank(admin);
        identity.addClaim(99);
    }

    // --- removeClaim ---

    function test_removeClaim() public {
        vm.startPrank(admin);
        identity.addClaim(CLAIM_KYC);
        identity.removeClaim(CLAIM_KYC);
        vm.stopPrank();

        assertFalse(identity.hasClaim(CLAIM_KYC));
    }

    function test_removeClaim_emitsEvent() public {
        vm.prank(admin);
        identity.addClaim(CLAIM_KYC);

        vm.expectEmit(true, true, false, false, address(identity));
        emit IIdentity.ClaimRemoved(CLAIM_KYC, admin);
        vm.prank(admin);
        identity.removeClaim(CLAIM_KYC);
    }

    function test_removeClaim_revertsIfInvalidIssuer() public {
        vm.prank(admin);
        identity.addClaim(CLAIM_KYC);

        vm.expectRevert(IIdentity.InvalidClaimIssuer.selector);
        vm.prank(unauthorizedIssuer);
        identity.removeClaim(CLAIM_KYC);
    }

    // --- hasClaim ---

    function test_hasClaim_returnsFalseForUnset() public view {
        assertFalse(identity.hasClaim(CLAIM_KYC));
        assertFalse(identity.hasClaim(9999));
    }

    function test_hasClaim_returnsTrueAfterAdd() public {
        vm.prank(admin);
        identity.addClaim(CLAIM_KYC);

        assertTrue(identity.hasClaim(CLAIM_KYC));
        assertFalse(identity.hasClaim(CLAIM_AML));
    }

    function test_multipleClaims() public {
        vm.startPrank(admin);
        identity.addClaim(CLAIM_KYC);
        identity.addClaim(CLAIM_AML);
        vm.stopPrank();

        assertTrue(identity.hasClaim(CLAIM_KYC));
        assertTrue(identity.hasClaim(CLAIM_AML));
    }
}
