// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PrismToken (Base spoke representation of a multi-VM Prism asset)
 * @notice Minimal, self-contained ERC20 — deliberately has no external imports (no
 * OpenZeppelin dependency is vendored anywhere in this repo; DEPLOYMENT_GUIDE.md has
 * users create a fresh, bare forge-init project and copy contracts/solidity .sol files
 * into it, so importing an OpenZeppelin path here would fail to resolve unless the
 * user remembers to separately install it). This implements the standard ERC20
 * interface directly; solidity ^0.8.20 has built-in checked arithmetic, so no
 * SafeMath is needed.
 */
contract PrismToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply, address _recipient) {
        require(_recipient != address(0), "PrismToken: mint to zero address");
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply;
        balanceOf[_recipient] = _initialSupply;
        emit Transfer(address(0), _recipient, _initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "PrismToken: insufficient allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "PrismToken: transfer to zero address");
        uint256 fromBalance = balanceOf[from];
        require(fromBalance >= value, "PrismToken: insufficient balance");
        balanceOf[from] = fromBalance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
