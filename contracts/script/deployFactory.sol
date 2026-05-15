// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console2} from "forge-std/Script.sol";
import {TokenFactory} from "../src/factories/TokenFactory.sol";
import {ClaimIssuerManager} from "../src/identity/ClaimIssuerManager.sol";
import {IdentityFactory} from "../src/identity/IdentityFactory.sol";

contract deployFactory is Script {
    bytes32 public IDENTITY_FACTORY_ADMIN = keccak256("IDENTITY_FACTORY_ADMIN");

    address public identityFactoryAddress = address(0);
    address public claimIssuerManagerAddress = address(0);

    function setUp() public {}
    
    function run() public {
        vm.startBroadcast();

        if (identityFactoryAddress == address(0)) {
            if (claimIssuerManagerAddress == address(0)) {
                claimIssuerManagerAddress = address(new ClaimIssuerManager(msg.sender));
            }

            identityFactoryAddress = address(new IdentityFactory(msg.sender, claimIssuerManagerAddress));
        }

        TokenFactory tokenFactory = new TokenFactory(identityFactoryAddress);
        IdentityFactory identityFactory = IdentityFactory(identityFactoryAddress);
        identityFactory.createIdentity(address(tokenFactory));
        identityFactory.grantRole(IDENTITY_FACTORY_ADMIN, address(tokenFactory));
        ClaimIssuerManager claimIssuerManager = ClaimIssuerManager(claimIssuerManagerAddress);
        claimIssuerManager.addTokenFactory(address(tokenFactory));

        uint256[] memory claims = new uint256[](1);
        claims[0] = 1;
        
        claimIssuerManager.addClaimIssuer(msg.sender, claims);
        
        console2.log("TokenFactory deployed at: %s", address(tokenFactory));
        console2.log("IdentityFactory deployed at: %s", identityFactoryAddress);
        console2.log("ClaimIssuerManager deployed at: %s", claimIssuerManagerAddress);

        vm.stopBroadcast();
    }

}