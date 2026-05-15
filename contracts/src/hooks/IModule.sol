// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ITokenModule {

    function beforeTokenTransfer(address from, address to, uint256 amount) external; 
    function afterTokenTransfer(address from, address to, uint256 amount) external; 

}