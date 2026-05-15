// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console2} from "forge-std/Script.sol";
import {USDC} from "../src/mocKUSDC.sol";

contract deployUSDC is Script {
    function setUp() public {}
    
    function run() public {
        vm.startBroadcast();

        USDC usdc = new USDC();

        console2.log("USDC deployed at: %s", address(usdc));

        vm.stopBroadcast();
    }

}