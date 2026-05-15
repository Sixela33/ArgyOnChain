import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract USDC is ERC20, ERC20Burnable, ERC20Permit {
    constructor()
        ERC20("USDC", "USDC")
        ERC20Permit("USDC")
    {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override {
        _burn(account, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
