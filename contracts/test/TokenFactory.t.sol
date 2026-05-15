// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {BaseTest} from "./BaseTest.t.sol";
import {Token} from "../src/Token.sol";
import {TokenFactory} from "../src/factories/TokenFactory.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract TokenFactoryTest is BaseTest {
    address internal newFactory = makeAddr("newFactory");

    // --- deployToken ---

    function test_deployToken_success() public {
        uint256[] memory claims = new uint256[](1);
        claims[0] = CLAIM_KYC;

        vm.prank(admin);
        address tokenAddr = tokenFactory.deployToken("My Token", "MTK", admin, enforcer, claims);

        assertTrue(tokenAddr != address(0));
        Token deployed = Token(tokenAddr);
        assertEq(deployed.name(), "My Token");
        assertEq(deployed.symbol(), "MTK");
        assertTrue(deployed.hasRole(deployed.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(deployed.hasRole(deployed.MINTER_ROLE(), enforcer));
    }

    function test_deployToken_emitsEvent() public {
        uint256[] memory claims = new uint256[](1);
        claims[0] = CLAIM_KYC;

        // We can't predict the token address, so only check indexed fields
        vm.expectEmit(false, true, false, false, address(tokenFactory));
        emit TokenFactory.TokenCreated(address(0), admin, "My Token", "MTK", claims, 0);
        vm.prank(admin);
        tokenFactory.deployToken("My Token", "MTK", admin, enforcer, claims);
    }

    function test_deployToken_defaultAdminFallsToSender() public {
        uint256[] memory claims = new uint256[](0);

        vm.prank(admin);
        address tokenAddr = tokenFactory.deployToken("My Token", "MTK", address(0), enforcer, claims);

        Token deployed = Token(tokenAddr);
        assertTrue(deployed.hasRole(deployed.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_deployToken_revertsIfNotAdmin() public {
        uint256[] memory claims = new uint256[](0);

        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            tokenFactory.FACTORY_ADMIN_ROLE()
        ));
        vm.prank(alice);
        tokenFactory.deployToken("My Token", "MTK", admin, enforcer, claims);
    }

    function test_deployToken_revertsIfEmptyName() public {
        uint256[] memory claims = new uint256[](0);

        vm.expectRevert(TokenFactory.EmptyString.selector);
        vm.prank(admin);
        tokenFactory.deployToken("", "MTK", admin, enforcer, claims);
    }

    function test_deployToken_revertsIfEmptySymbol() public {
        uint256[] memory claims = new uint256[](0);

        vm.expectRevert(TokenFactory.EmptyString.selector);
        vm.prank(admin);
        tokenFactory.deployToken("My Token", "", admin, enforcer, claims);
    }

    function test_deployToken_revertsIfZeroEnforcer() public {
        uint256[] memory claims = new uint256[](0);

        vm.expectRevert(abi.encodeWithSelector(
            TokenFactory.InvalidAddress.selector,
            "Enforcer cannot be zero address"
        ));
        vm.prank(admin);
        tokenFactory.deployToken("My Token", "MTK", admin, address(0), claims);
    }

    function test_deployToken_revertsIfClaimsArrayTooLarge() public {
        uint256[] memory bigClaims = new uint256[](101);

        vm.expectRevert(TokenFactory.ArrayTooLarge.selector);
        vm.prank(admin);
        tokenFactory.deployToken("My Token", "MTK", admin, enforcer, bigClaims);
    }

    // --- updateIdentityFactory ---

    function test_updateIdentityFactory() public {
        vm.prank(admin);
        tokenFactory.updateIdentityFactory(newFactory);

        assertEq(tokenFactory.identityFactory(), newFactory);
    }

    function test_updateIdentityFactory_emitsEvent() public {
        address oldFactory = tokenFactory.identityFactory();

        vm.expectEmit(true, true, false, false, address(tokenFactory));
        emit TokenFactory.IdentityFactoryUpdated(oldFactory, newFactory);
        vm.prank(admin);
        tokenFactory.updateIdentityFactory(newFactory);
    }

    function test_updateIdentityFactory_revertsIfSameFactory() public {
        address current = tokenFactory.identityFactory();

        vm.expectRevert(abi.encodeWithSelector(
            TokenFactory.InvalidAddress.selector,
            "New factory same as current"
        ));
        vm.prank(admin);
        tokenFactory.updateIdentityFactory(current);
    }

    function test_updateIdentityFactory_revertsIfZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(
            TokenFactory.InvalidAddress.selector,
            "New identity factory cannot be zero address"
        ));
        vm.prank(admin);
        tokenFactory.updateIdentityFactory(address(0));
    }

    function test_updateIdentityFactory_revertsIfNotAdmin() public {
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            alice,
            tokenFactory.DEFAULT_ADMIN_ROLE()
        ));
        vm.prank(alice);
        tokenFactory.updateIdentityFactory(newFactory);
    }
}
