// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ERC20Interface.sol";
import "./ERC223Interface.sol";
import "./ERC223ReceivingContract.sol";


contract AssetToken is ERC223Interface, IERC20 {
    using SafeMath for uint256;

    string public _name;
    string public _symbol;
    uint8 public _decimals;
    uint256 public _totalSupply;

    address private _owner;
    bool private _isActive;
    mapping(address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;

    event Fund(address indexed member, uint256 value, uint256 balance);
    event Defund(address indexed member, uint256 value, uint256 balance);
    event Switch(bool balance);

    constructor(string memory symbol, string memory name) public {
        _symbol = symbol;
        _name = name;
        _owner = msg.sender;
        _isActive = true;
        _totalSupply = 0;
        _decimals = 3;
    }

    function () external payable {
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

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowed[owner][spender];
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address who) external view returns (uint256) {
        return _balances[who];
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
        if (_isActive == true) {
            _isActive = false;
        }
        emit Switch(false);
    }

    function getTradingStatus() public returns (bool) {
        emit Switch(_isActive);
        return _isActive;
    }

    // solhint-disable-next-line no-simple-event-func-name
    function fund(address member, uint256 value) public onlyOwner checkActive noOwnerAsCounterparty(member) {
        _balances[member] = _balances[member].add(value);
        _totalSupply = _totalSupply.add(value);

        emit Fund(member, value, _balances[member]);
    }

    // solhint-disable-next-line no-simple-event-func-name
    function defund(uint256 value) public checkActive noOwnerAsCounterparty(msg.sender) {
        if (this.balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _totalSupply = _totalSupply.sub(value);

        emit Defund(msg.sender, value, _balances[msg.sender]);
    }

    function approve(address spender, uint256 value) external checkActive returns (bool) {
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function increaseApproval(address spender, uint256 addedValue) public checkActive returns (bool) {
        _allowed[msg.sender][spender] = _allowed[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function decreaseApproval(address spender, uint256 subtractedValue) public checkActive returns (bool) {
        uint256 oldValue = _allowed[msg.sender][spender];
        if (subtractedValue > oldValue) {
            _allowed[msg.sender][spender] = 0;
        } else {
            _allowed[msg.sender][spender] = oldValue.sub(subtractedValue);
        }
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function transferFrom(address from, address to, uint256 value)
    external checkActive noOwnerAsCounterparty(from) noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
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

    function transfer(address to, uint256 value)
    external checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        return transferImpl(to, value);
    }

    function transfer(address to, uint256 value, bytes calldata data)
    external checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        return transferImpl(to, value, data);
    }

    function transfer(address to, uint256 value, bytes calldata data, string calldata customFallback)
    external checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        return transferImpl(to, value, data, customFallback);
    }


    function transferImpl(address to, uint256 value)
    private checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
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

    function transferImpl(address to, uint256 value, bytes memory data)
    private checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            return transferToContract(to, value, data);
        } else {
            return transferToAddress(to, value, data);
        }
    }

    function transferImpl(address to, uint256 value, bytes memory data, string memory customFallback)
    private checkActive noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            if (this.balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

            _balances[msg.sender] = _balances[msg.sender].sub(value);
            _balances[to] = _balances[to].add(value);

            bool success; 
            bytes memory result;
            // solhint-disable-next-line avoid-call-value
            (success, result) = to.call.value(0)(abi.encodeWithSignature(customFallback, msg.sender, value, data));
            assert(success);

            emit Transfer(msg.sender, to, value, data);

            return true;
        } else {
            return transferToAddress(to, value, data);
        }
    }

    // These function wrap the overloaded transfer functions, so when we generate a Go wrapper (which does not 
    // support function overloading) we can call the correct version
    function transferWithDataAndFallback(address to, uint256 value, bytes memory data, string memory fallback) public {
        transferImpl(to, value, data, fallback);
    }

    function transferWithData(address _to, uint256 _value, bytes memory _data) public {
        transferImpl(_to, _value, _data);
    }

    function transferNoData(address _to, uint256 _value) public {
        transferImpl(_to, _value);
    }

    function isContract(address addr) private view returns (bool) {
        uint256 length;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(addr)
        }
        return (length > 0);
    }

    function transferToAddress(address to, uint256 value, bytes memory data) private checkActive returns (bool) {
        if (this.balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }

    function transferToContract(address to, uint256 value, bytes memory data) private checkActive returns (bool) {
        if (this.balanceOf(msg.sender) < value) revert("You must have sufficent balance to perform this operation");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
        receiver.tokenFallback(msg.sender, value, data);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }
}
