// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {BaseTest} from "./BaseTest.t.sol";
import {IdentityFactory} from "../src/identity/IdentityFactory.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract IdentityFactoryTest is BaseTest {
    // --- createIdentity ---

    function test_createIdentity() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        assertTrue(identityAddr != address(0));
        assertTrue(identityFactory.hasIdentity(alice));
        assertEq(identityFactory.getIdentity(alice), identityAddr);
    }

    function test_createIdentity_emitsEvent() public {
        // We can't predict the deployed identity address, so only check the wallet topic
        vm.expectEmit(true, false, false, false, address(identityFactory));
        emit IdentityFactory.IdentityCreated(alice, address(0)); // address(0) = any non-indexed value
        vm.prank(admin);
        identityFactory.createIdentity(alice);
    }

    function test_createIdentity_revertsIfZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(
            IdentityFactory.InvalidAddress.selector,
            "Invalid wallet address"
        ));
        vm.prank(admin);
        identityFactory.createIdentity(address(0));
    }

    function test_createIdentity_revertsIfAlreadyExists() public {
        vm.startPrank(admin);
        identityFactory.createIdentity(alice);
        vm.expectRevert(IdentityFactory.IdentityAlreadyExists.selector);
        identityFactory.createIdentity(alice);
        vm.stopPrank();
    }

    function test_createIdentity_revertsIfNotAdmin() public {
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            charlie,
            identityFactory.IDENTITY_FACTORY_ADMIN()
        ));
        vm.prank(charlie);
        identityFactory.createIdentity(alice);
    }

    // --- getIdentity / hasIdentity ---

    function test_getIdentity_returnsZeroForUnknown() public view {
        assertEq(identityFactory.getIdentity(charlie), address(0));
    }

    function test_hasIdentity_falseForUnknown() public view {
        assertFalse(identityFactory.hasIdentity(charlie));
    }

    function test_hasIdentity_trueAfterCreate() public {
        vm.prank(admin);
        identityFactory.createIdentity(alice);
        assertTrue(identityFactory.hasIdentity(alice));
    }

    // --- linkWallet ---

    function test_linkWallet() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        vm.prank(admin);
        identityFactory.linkWallet(identityAddr, bob);

        assertTrue(identityFactory.hasIdentity(bob));
        assertEq(identityFactory.getIdentity(bob), identityAddr);
    }

    function test_linkWallet_emitsEvent() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        vm.expectEmit(true, true, false, false, address(identityFactory));
        emit IdentityFactory.WalletLinked(bob, identityAddr);
        vm.prank(admin);
        identityFactory.linkWallet(identityAddr, bob);
    }

    function test_linkWallet_revertsIfZeroIdentity() public {
        vm.expectRevert(abi.encodeWithSelector(
            IdentityFactory.InvalidAddress.selector,
            "Invalid identity address"
        ));
        vm.prank(admin);
        identityFactory.linkWallet(address(0), bob);
    }

    function test_linkWallet_revertsIfZeroWallet() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        vm.expectRevert(abi.encodeWithSelector(
            IdentityFactory.InvalidAddress.selector,
            "Invalid wallet address"
        ));
        vm.prank(admin);
        identityFactory.linkWallet(identityAddr, address(0));
    }

    function test_linkWallet_revertsIfWalletAlreadyHasIdentity() public {
        vm.startPrank(admin);
        address identityAddr = identityFactory.createIdentity(alice);
        identityFactory.createIdentity(bob);
        vm.expectRevert(IdentityFactory.IdentityAlreadyExists.selector);
        identityFactory.linkWallet(identityAddr, bob);
        vm.stopPrank();
    }

    function test_linkWallet_revertsIfNotAdmin() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            charlie,
            identityFactory.IDENTITY_FACTORY_ADMIN()
        ));
        vm.prank(charlie);
        identityFactory.linkWallet(identityAddr, bob);
    }

    // --- unlinkWallet ---

    function test_unlinkWallet() public {
        vm.prank(admin);
        address identityAddr = identityFactory.createIdentity(alice);

        vm.expectEmit(true, true, false, false, address(identityFactory));
        emit IdentityFactory.WalletUnlinked(alice, identityAddr);
        vm.prank(admin);
        identityFactory.unlinkWallet(alice);

        assertFalse(identityFactory.hasIdentity(alice));
        assertEq(identityFactory.getIdentity(alice), address(0));
    }

    function test_unlinkWallet_revertsIfZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(
            IdentityFactory.InvalidAddress.selector,
            "Invalid wallet address"
        ));
        vm.prank(admin);
        identityFactory.unlinkWallet(address(0));
    }

    function test_unlinkWallet_revertsIfNoIdentity() public {
        vm.expectRevert(IdentityFactory.IdentityNotFound.selector);
        vm.prank(admin);
        identityFactory.unlinkWallet(charlie);
    }

    function test_unlinkWallet_revertsIfNotAdmin() public {
        vm.prank(admin);
        identityFactory.createIdentity(alice);

        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            charlie,
            identityFactory.IDENTITY_FACTORY_ADMIN()
        ));
        vm.prank(charlie);
        identityFactory.unlinkWallet(alice);
    }
}
