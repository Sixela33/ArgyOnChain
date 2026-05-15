// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {BaseTest} from "./BaseTest.t.sol";
import {Token} from "../src/Token.sol";
import {Gorra} from "../src/identity/Gorra.sol";
import {Identity} from "../src/identity/Identity.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC20Freezable} from "@openzeppelin/community-contracts/token/ERC20/extensions/ERC20Freezable.sol";

contract TokenTest is BaseTest {
    // --- Constructor / Roles ---

    function test_rolesGranted() public view {
        assertTrue(token.hasRole(token.PAUSER_ROLE(), enforcer));
        assertTrue(token.hasRole(token.MINTER_ROLE(), enforcer));
        assertTrue(token.hasRole(token.BURNER_ROLE(), enforcer));
        assertTrue(token.hasRole(token.FREEZER_ROLE(), enforcer));
        assertTrue(token.hasRole(token.ENFORCER_ROLE(), enforcer));
    }

    function test_adminIsDefaultAdmin() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_emptyName_reverts() public {
        uint256[] memory claims = new uint256[](0);
        vm.expectRevert(abi.encodeWithSelector(Token.EmptyString.selector, "Token name cannot be empty"));
        new Token("", "RWA", admin, enforcer, address(identityFactory), claims);
    }

    function test_emptySymbol_reverts() public {
        uint256[] memory claims = new uint256[](0);
        vm.expectRevert(abi.encodeWithSelector(Token.EmptyString.selector, "Token symbol cannot be empty"));
        new Token("RWA Token", "", admin, enforcer, address(identityFactory), claims);
    }

    function test_claimsArrayTooLarge_reverts() public {
        uint256[] memory bigClaims = new uint256[](101);
        vm.expectRevert(Gorra.InvalidArray.selector);
        new Token("RWA Token", "RWA", admin, enforcer, address(identityFactory), bigClaims);
    }

    function test_zeroDefaultAdmin_reverts() public {
        uint256[] memory claims = new uint256[](0);
        vm.expectRevert(abi.encodeWithSelector(Gorra.InvalidAddress.selector, "Default admin cannot be zero address"));
        new Token("RWA Token", "RWA", address(0), enforcer, address(identityFactory), claims);
    }

    function test_zeroEnforcer_reverts() public {
        uint256[] memory claims = new uint256[](0);
        vm.expectRevert(abi.encodeWithSelector(Gorra.InvalidAddress.selector, "Enforcer cannot be zero address"));
        new Token("RWA Token", "RWA", admin, address(0), address(identityFactory), claims);
    }

    // --- Mint ---

    function test_mint_success() public {
        _setupIdentityWithClaim(alice);

        vm.prank(enforcer);
        token.mint(alice, 100e18);

        assertEq(token.balanceOf(alice), 100e18);
    }

    function test_mint_emitsEvent() public {
        _setupIdentityWithClaim(alice);

        vm.expectEmit(true, true, false, true, address(token));
        emit Token.TokenMinted(alice, 100e18, enforcer);
        vm.prank(enforcer);
        token.mint(alice, 100e18);
    }

    function test_mint_revertsIfNotMinter() public {
        _setupIdentityWithClaim(alice);

        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            token.MINTER_ROLE()
        ));
        vm.prank(alice);
        token.mint(alice, 100e18);
    }

    function test_mint_revertsIfZeroAmount() public {
        _setupIdentityWithClaim(alice);

        vm.expectRevert(abi.encodeWithSelector(Token.InvalidAmount.selector, "Cannot mint zero amount"));
        vm.prank(enforcer);
        token.mint(alice, 0);
    }

    function test_mint_revertsIfRecipientHasNoIdentity() public {
        vm.expectRevert(abi.encodeWithSelector(
            Gorra.InvalidAddress.selector,
            "Recipient has no identity"
        ));
        vm.prank(enforcer);
        token.mint(charlie, 100e18);
    }

    function test_mint_revertsIfRecipientMissingClaim() public {
        // alice has identity but no KYC claim
        vm.prank(admin);
        identityFactory.createIdentity(alice);

        vm.expectRevert(Gorra.InsufficientPermissions.selector);
        vm.prank(enforcer);
        token.mint(alice, 100e18);
    }

    // --- Burn ---

    function test_burn_success() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(alice);
        token.burn(40e18);

        assertEq(token.balanceOf(alice), 60e18);
    }

    function test_burn_emitsEvent() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.expectEmit(true, true, false, true, address(token));
        emit Token.TokenBurned(alice, 40e18, alice);
        vm.prank(alice);
        token.burn(40e18);
    }

    function test_burn_revertsIfZeroAmount() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.expectRevert(abi.encodeWithSelector(Token.InvalidAmount.selector, "Cannot burn zero amount"));
        vm.prank(alice);
        token.burn(0);
    }

    // --- BurnFrom ---

    function test_burnFrom_success() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(alice);
        token.approve(enforcer, 50e18);

        vm.prank(enforcer);
        token.burnFrom(alice, 50e18);

        assertEq(token.balanceOf(alice), 50e18);
    }

    function test_burnFrom_emitsEvent() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);
        vm.prank(alice);
        token.approve(enforcer, 50e18);

        vm.expectEmit(true, true, false, true, address(token));
        emit Token.TokenBurned(alice, 50e18, enforcer);
        vm.prank(enforcer);
        token.burnFrom(alice, 50e18);
    }

    function test_burnFrom_revertsIfNotBurner() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);
        vm.prank(alice);
        token.approve(bob, 50e18);

        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            bob,
            token.BURNER_ROLE()
        ));
        vm.prank(bob);
        token.burnFrom(alice, 50e18);
    }

    // --- Pause ---

    function test_pause_success() public {
        vm.prank(enforcer);
        token.pause();

        assertTrue(token.paused());
    }

    function test_pause_revertsIfNotPauser() public {
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            token.PAUSER_ROLE()
        ));
        vm.prank(alice);
        token.pause();
    }

    function test_unpause_success() public {
        vm.startPrank(enforcer);
        token.pause();
        token.unpause();
        vm.stopPrank();

        assertFalse(token.paused());
    }

    function test_transfer_revertsWhenPaused() public {
        _setupIdentityWithClaim(alice);
        _setupIdentityWithClaim(bob);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(enforcer);
        token.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        token.transfer(bob, 10e18);
    }

    // --- Transfer (Gorra gates) ---

    function test_transfer_success() public {
        _setupIdentityWithClaim(alice);
        _setupIdentityWithClaim(bob);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(alice);
        token.transfer(bob, 30e18);

        assertEq(token.balanceOf(alice), 70e18);
        assertEq(token.balanceOf(bob), 30e18);
    }

    function test_transfer_revertsIfSenderNoIdentity() public {
        // Mint to alice while she has identity+claim, then unlink her
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        _setupIdentityWithClaim(bob);

        vm.prank(admin);
        identityFactory.unlinkWallet(alice);

        vm.expectRevert(abi.encodeWithSelector(
            Gorra.InvalidAddress.selector,
            "Sender has no identity"
        ));
        vm.prank(alice);
        token.transfer(bob, 10e18);
    }

    function test_transfer_revertsIfRecipientNoIdentity() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        // charlie has no identity
        vm.expectRevert(abi.encodeWithSelector(
            Gorra.InvalidAddress.selector,
            "Recipient has no identity"
        ));
        vm.prank(alice);
        token.transfer(charlie, 10e18);
    }

    function test_transfer_revertsIfSenderMissingClaim() public {
        // Give alice identity + claim to mint, then strip the claim
        address aliceIdentity = _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(admin);
        Identity(aliceIdentity).removeClaim(CLAIM_KYC);

        _setupIdentityWithClaim(bob);

        vm.expectRevert(Gorra.InsufficientPermissions.selector);
        vm.prank(alice);
        token.transfer(bob, 10e18);
    }

    function test_transfer_revertsIfRecipientMissingClaim() public {
        _setupIdentityWithClaim(alice);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        // bob has identity but no claims
        vm.prank(admin);
        identityFactory.createIdentity(bob);

        vm.expectRevert(Gorra.InsufficientPermissions.selector);
        vm.prank(alice);
        token.transfer(bob, 10e18);
    }

    // --- Freeze (ERC20uRWA / ERC20Freezable) ---

    function test_freeze_blocksTransfer() public {
        _setupIdentityWithClaim(alice);
        _setupIdentityWithClaim(bob);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(enforcer);
        token.setFrozenTokens(alice, 100e18);

        assertEq(token.frozen(alice), 100e18);
        assertEq(token.available(alice), 0);

        vm.expectRevert(abi.encodeWithSelector(
            ERC20Freezable.ERC20InsufficientUnfrozenBalance.selector,
            alice,
            1,
            0
        ));
        vm.prank(alice);
        token.transfer(bob, 1);
    }

    function test_unfreeze_restoresTransfer() public {
        _setupIdentityWithClaim(alice);
        _setupIdentityWithClaim(bob);
        vm.prank(enforcer);
        token.mint(alice, 100e18);

        vm.prank(enforcer);
        token.setFrozenTokens(alice, 100e18);

        vm.prank(enforcer);
        token.setFrozenTokens(alice, 0);

        vm.prank(alice);
        token.transfer(bob, 50e18);

        assertEq(token.balanceOf(bob), 50e18);
    }

    // --- Required Claims ---

    function test_setRequiredClaims() public {
        uint256[] memory newClaims = new uint256[](2);
        newClaims[0] = 1;
        newClaims[1] = 2;

        vm.prank(admin);
        token.setRequiredClaims(newClaims);

        uint256[] memory stored = token.getRequiredClaims();
        assertEq(stored.length, 2);
        assertEq(stored[0], 1);
        assertEq(stored[1], 2);
    }

    function test_setRequiredClaims_emitsEvent() public {
        uint256[] memory oldClaims = token.getRequiredClaims();
        uint256[] memory newClaims = new uint256[](0);

        vm.expectEmit(false, false, false, true, address(token));
        emit Gorra.RequiredClaimsUpdated(oldClaims, newClaims);
        vm.prank(admin);
        token.setRequiredClaims(newClaims);
    }

    function test_setRequiredClaims_revertsIfNotAdmin() public {
        uint256[] memory newClaims = new uint256[](0);
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            token.DEFAULT_ADMIN_ROLE()
        ));
        vm.prank(alice);
        token.setRequiredClaims(newClaims);
    }

    function test_setRequiredClaims_revertsIfArrayTooLarge() public {
        uint256[] memory bigClaims = new uint256[](101);
        vm.expectRevert(Gorra.InvalidArray.selector);
        vm.prank(admin);
        token.setRequiredClaims(bigClaims);
    }

    // --- View helpers ---

    function test_getRequiredClaims() public view {
        uint256[] memory claims = token.getRequiredClaims();
        assertEq(claims.length, 1);
        assertEq(claims[0], CLAIM_KYC);
    }

    function test_hasRequiredClaims_trueWhenClaimsPresent() public {
        _setupIdentityWithClaim(alice);
        assertTrue(token.hasRequiredClaims(alice));
    }

    function test_hasRequiredClaims_falseWhenNoIdentity() public view {
        assertFalse(token.hasRequiredClaims(charlie));
    }
}
