// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ITokenModule} from "./IModule.sol";

abstract contract Hooks is ERC20 {
    
    address[] hooks;
    address linkedToken;

    error InvalidAddress(string message);
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function _onlyHookManager() internal view virtual;

    function addHook(address _hook) public {
        _onlyHookManager();
        if(_hook == address(0)) revert InvalidAddress("Hook cannot be zero address");
        hooks.push(_hook);
    }

    function batchAddHooks(address[] memory _hooks) public {
        _onlyHookManager();
        for (uint256 i = 0; i < _hooks.length; i++) {
            addHook(_hooks[i]);
        }
    }

    function removeHook(address _hook) public {
        _onlyHookManager();
        if(_hook == address(0)) revert InvalidAddress("Hook cannot be zero address");   
        for (uint256 i = 0; i < hooks.length; i++) {
            if (hooks[i] == _hook) {
                hooks[i] = hooks[hooks.length - 1];
                hooks.pop();
                break;
            }
        }
    }

    function setToken(address token) public {
        _onlyHookManager();
        if(token == address(0)) revert InvalidAddress("Token cannot be zero address");
        linkedToken = token;
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        // Call beforeTokenTransfer on all hooks
        for (uint256 i = 0; i < hooks.length; i++) {
            ITokenModule(hooks[i]).beforeTokenTransfer(from, to, value);
        }

        super._update(from, to, value);
        
        // Call afterTokenTransfer on all hooks
        for (uint256 i = 0; i < hooks.length; i++) {
            ITokenModule(hooks[i]).afterTokenTransfer(from, to, value);
        }
    }
}