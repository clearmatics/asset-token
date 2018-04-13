pragma solidity 0.4.21;

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
    mapping(address => uint) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;

    event Fund(address indexed member, uint256 value, uint256 balance);
    event Defund(address indexed member, uint256 value, uint256 balance);

    function AssetToken(string _symbol, string _name) public {
        symbol = _symbol;
        name = _name;
        _owner = msg.sender;
        totalSupply = 0;
        decimals = 3;
    }

    function () public payable {
        revert();
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert();
        }
        _;
    }

    modifier noOwnerAsCounterparty(address counterparty) {
        if (counterparty == _owner) {
            revert();
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

    function fund(address member, uint256 value) public onlyOwner noOwnerAsCounterparty(member) {
        _balances[member] = _balances[member].add(value);
        totalSupply = totalSupply.add(value);

        emit Fund(member, value, _balances[member]);
    }

    function defund(uint256 value) public noOwnerAsCounterparty(msg.sender) {
        if (balanceOf(msg.sender) < value) revert();

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        totalSupply = totalSupply.sub(value);

        emit Defund(msg.sender, value, _balances[msg.sender]);
    }

    function approve(address spender, uint256 value) public returns (bool) {
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function increaseApproval(address spender, uint addedValue) public returns (bool) {
        _allowed[msg.sender][spender] = _allowed[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function decreaseApproval(address spender, uint subtractedValue) public returns (bool) {
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
    public noOwnerAsCounterparty(from) noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
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
    public noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
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
    public noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            return transferToContract(to, value, data);
        } else {
            return transferToAddress(to, value, data);
        }
    }

    function transfer(address to, uint value, bytes data, string customFallback)
    public noOwnerAsCounterparty(to) noOwnerAsCounterparty(msg.sender)
    returns (bool) {
        if (isContract(to)) {
            if (balanceOf(msg.sender) < value) revert();

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

    function transferToAddress(address to, uint value, bytes data) private returns (bool) {
        if (balanceOf(msg.sender) < value) revert();

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }

    function transferToContract(address to, uint value, bytes data) private returns (bool) {
        if (balanceOf(msg.sender) < value) revert();

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
        receiver.tokenFallback(msg.sender, value, data);

        emit Transfer(msg.sender, to, value, data);

        return true;
    }
}
