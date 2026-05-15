// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ClaimIssuerManager} from "../../src/identity/ClaimIssuerManager.sol";
import {IdentityFactory} from "../../src/identity/IdentityFactory.sol";
import {Identity} from "../../src/identity/Identity.sol";
import {TokenFactory} from "../../src/factories/TokenFactory.sol";
import {Token} from "../../src/Token.sol";
import {Gorra} from "../../src/identity/Gorra.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract FullFlowTest is Test {
    uint256 internal constant CLAIM_KYC = 1;

    address internal deployer = makeAddr("deployer");
    address internal enforcer = makeAddr("enforcer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal charlie = makeAddr("charlie");

    ClaimIssuerManager internal claimIssuerManager;
    IdentityFactory internal identityFactory;
    TokenFactory internal tokenFactory;
    Token internal token;

    function setUp() public {
        // Step 1-2: Deploy core infrastructure (mirrors deployFactory.sol script)
        claimIssuerManager = new ClaimIssuerManager(deployer);

        vm.prank(deployer);
        identityFactory = new IdentityFactory(deployer, address(claimIssuerManager));

        vm.prank(deployer);
        tokenFactory = new TokenFactory(address(identityFactory));

        // Step 3: Wire factories together
        vm.startPrank(deployer);
        claimIssuerManager.addTokenFactory(address(tokenFactory));
        identityFactory.grantRole(identityFactory.IDENTITY_FACTORY_ADMIN(), address(tokenFactory));

        // Step 4: Register deployer as a claim issuer for CLAIM_KYC
        uint256[] memory issuerClaims = new uint256[](1);
        issuerClaims[0] = CLAIM_KYC;
        claimIssuerManager.addClaimIssuer(deployer, issuerClaims);
        vm.stopPrank();

        // Step 5: Deploy token via factory
        uint256[] memory requiredClaims = new uint256[](1);
        requiredClaims[0] = CLAIM_KYC;
        vm.prank(deployer);
        address tokenAddr = tokenFactory.deployToken(
            "Argy RWA",
            "ARWA",
            deployer,
            enforcer,
            requiredClaims
        );
        token = Token(tokenAddr);
    }

    function test_fullFlow_happyPath() public {
        // Step 6: Create identity for alice and issue KYC claim
        vm.prank(deployer);
        address aliceIdentity = identityFactory.createIdentity(alice);
        vm.prank(deployer);
        Identity(aliceIdentity).addClaim(CLAIM_KYC);

        // Step 7: Mint tokens to alice
        vm.prank(enforcer);
        token.mint(alice, 1000e18);
        assertEq(token.balanceOf(alice), 1000e18);

        // Step 8: Create identity for bob and issue KYC claim
        vm.prank(deployer);
        address bobIdentity = identityFactory.createIdentity(bob);
        vm.prank(deployer);
        Identity(bobIdentity).addClaim(CLAIM_KYC);

        // Step 9: alice transfers to bob — both have identity + claims
        vm.prank(alice);
        token.transfer(bob, 200e18);
        assertEq(token.balanceOf(alice), 800e18);
        assertEq(token.balanceOf(bob), 200e18);
    }

    function test_fullFlow_charlieNoIdentityCannotReceive() public {
        vm.prank(deployer);
        address aliceIdentity = identityFactory.createIdentity(alice);
        vm.prank(deployer);
        Identity(aliceIdentity).addClaim(CLAIM_KYC);
        vm.prank(enforcer);
        token.mint(alice, 1000e18);

        // charlie has no identity — transfer to him must fail
        vm.expectRevert(abi.encodeWithSelector(
            Gorra.InvalidAddress.selector,
            "Recipient has no identity"
        ));
        vm.prank(alice);
        token.transfer(charlie, 100e18);
    }

    function test_fullFlow_pauseBlocksAllTransfers() public {
        vm.prank(deployer);
        address aliceIdentity = identityFactory.createIdentity(alice);
        vm.prank(deployer);
        Identity(aliceIdentity).addClaim(CLAIM_KYC);
        vm.prank(deployer);
        address bobIdentity = identityFactory.createIdentity(bob);
        vm.prank(deployer);
        Identity(bobIdentity).addClaim(CLAIM_KYC);

        vm.prank(enforcer);
        token.mint(alice, 1000e18);

        // Pause
        vm.prank(enforcer);
        token.pause();

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        token.transfer(bob, 100e18);

        // Unpause — transfer succeeds
        vm.prank(enforcer);
        token.unpause();

        vm.prank(alice);
        token.transfer(bob, 100e18);
        assertEq(token.balanceOf(bob), 100e18);
    }

    function test_fullFlow_multiWalletIdentityLinking() public {
        // alice creates identity, links a second wallet (e.g. hardware wallet)
        vm.prank(deployer);
        address aliceIdentity = identityFactory.createIdentity(alice);
        vm.prank(deployer);
        Identity(aliceIdentity).addClaim(CLAIM_KYC);

        // Link charlie as alice's second wallet
        vm.prank(deployer);
        identityFactory.linkWallet(aliceIdentity, charlie);

        // Mint to alice's primary wallet
        vm.prank(enforcer);
        token.mint(alice, 500e18);

        // charlie also has identity+claim via linked identity — mint to him succeeds
        vm.prank(enforcer);
        token.mint(charlie, 300e18);
        assertEq(token.balanceOf(charlie), 300e18);
    }

    function test_fullFlow_claimRevocationBlocksTransfer() public {
        vm.prank(deployer);
        address aliceIdentity = identityFactory.createIdentity(alice);
        vm.prank(deployer);
        Identity(aliceIdentity).addClaim(CLAIM_KYC);
        vm.prank(deployer);
        address bobIdentity = identityFactory.createIdentity(bob);
        vm.prank(deployer);
        Identity(bobIdentity).addClaim(CLAIM_KYC);

        vm.prank(enforcer);
        token.mint(alice, 1000e18);

        // Revoke alice's KYC claim
        vm.prank(deployer);
        Identity(aliceIdentity).removeClaim(CLAIM_KYC);

        // alice can no longer transfer
        vm.expectRevert(Gorra.InsufficientPermissions.selector);
        vm.prank(alice);
        token.transfer(bob, 100e18);
    }
}
