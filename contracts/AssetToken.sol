// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.4.24;

import "./SafeMath.sol";
import "./ERC20Interface.sol";
import "./ERC223Interface.sol";
import "./ERC223ReceivingContract.sol";


contract AssetToken is ERC223Interface, ERC20Interface {
    using SafeMath for uint;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    address private _owner;
    bool private _isActive;
    mapping(address => uint) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;

    event Fund(address indexed member, uint256 value, uint256 balance);
    event Defund(address indexed member, uint256 value, uint256 balance);
    event Switch(bool balance);

    constructor(string _symbol, string _name) public {
        symbol = _symbol;
        name = _name;
        _owner = msg.sender;
        _isActive = true;
        totalSupply = 0;
        decimals = 3;
    }

    function () public payable {
        revert("This contract does not support ETH");
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert("Only the contract owner can perform this operation");
        }
        _;
    }

    // @dev stops system when switched to false
    modifier checkActive() {
        if (_isActive != true) {
            revert("Contract emergency stop is activated");
        }
        _;
    }

    modifier noOwnerAsCounterparty(address counterparty) {
        if (counterparty == _owner) {
            revert("The contract owner can not perform this operation");
        }
        _;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function name() public view returns (string) {
        return name;
    }

    function symbol() public view returns (string) {
        return symbol;
    }

    function decimals() public view returns (uint8) {
        return decimals;
    }

    function totalSupply() public view returns (uint256) {
        return totalSupply;
    }

    function balanceOf(address owner) public view returns (uint balance) {
        return _balances[owner];
    }

    // @dev starts trading by switching _isActive to true
    function emergencyStart() public onlyOwner {
        if (_isActive == false) {
          _isActive = true;
        }
        emit Switch(true);
    }

    // @dev stops trading by switching _isActive to false
    function emergencyStop() public onlyOwner {
        if (_isActive ==  true) {
          _isActive = false;
        }
        emit Switch(false);
    }

    function getTradingStatus() public returns (bool) {
      emit Switch(_isActive);
      return _isActive;
    }

    function fund(address member, uint256 value) public onlyOwner checkActive noOwnerAsCounterparty(member) {
        _balances[member] = _balances[member].add(value);
        totalSupply = totalSupply.add(value);

        emit Fund(member, value, _balances[member]);
    }

    function defund(uint256 value) public checkActive noOwnerAsCounterparty(msg.sender) {
        if (balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        totalSupply = totalSupply.sub(value);

        emit Defund(msg.sender, value, _balances[msg.sender]);
    }

    function approve(address spender, uint256 value) public checkActive returns (bool) {
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function increaseApproval(address spender, uint addedValue) public checkActive returns (bool) {
        _allowed[msg.sender][spender] = _allowed[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function decreaseApproval(address spender, uint subtractedValue) public checkActive returns (bool) {
        uint oldValue = _allowed[msg.sender][spender];
        if (subtractedValue > oldValue) {
            _allowed[msg.sender][spender] = 0;
        } else {
            _allowed[msg.sender][spender] = oldValue.sub(subtractedValue);
        }
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function transferFrom(address from, address to, uint256 value)
    public checkActive noOwnerAsCounterparty(from) noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        require(to != address(0));
        require(value <= _balances[from]);
        require(value <= _allowed[from][msg.sender]);

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        emit Transfer(from, to, value);
        return true;
    }

    function transfer(address to, uint value)
    public checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons
        bytes memory empty;
        if (isContract(to)) {
            return transferToContract(to, value, empty);
        } else {
            return transferToAddress(to, value, empty);
        }
    }

    function transfer(address to, uint value, bytes data)
    public checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            return transferToContract(to, value, data);
        } else {
            return transferToAddress(to, value, data);
        }
    }

    function transfer(address to, uint value, bytes data, string customFallback)
    public checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            if (balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

            _balances[msg.sender] = _balances[msg.sender].sub(value);
            _balances[to] = _balances[to].add(value);
            // solhint-disable-next-line avoid-call-value
            assert(to.call.value(0)(bytes4(keccak256(customFallback)), msg.sender, value, data));

            emit Transfer(msg.sender, to, value, data);

            return true;
        } else {
            return transferToAddress(to, value, data);
        }
    }

    function isContract(address addr) private view returns (bool) {
        uint length;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(addr)
        }
        return (length > 0);
    }

    function transferToAddress(address to, uint value, bytes data) private checkActive returns (bool) {
        if (balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }

    function transferToContract(address to, uint value, bytes data) private checkActive returns (bool) {
        if (balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
        receiver.tokenFallback(msg.sender, value, data);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }
}
