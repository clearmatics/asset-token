pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-eth/contracts/utils/Address.sol";
import "zos-lib/contracts/Initializable.sol";
import "./ERC777Recipient.sol";
import "./ERC777Sender.sol";

contract AssetToken is IERC777, Initializable {
    using SafeMath for uint256;
    using Address for address;

    string public _name;
    string public _symbol;
    uint256 public _totalSupply;
    uint256 public _granularity;

    address private _owner;
    address private _emergencyDelegate;

    mapping(address => uint256) private _balances;

    //must be immutable
    address[] private _defaultOperatorsArray;
    mapping(address => bool) private _defaultOperators;

    // maps operators and revoked default ones to each account
    mapping(address => mapping(address => bool)) private _operators;
    mapping(address => mapping(address => bool)) private _revokedDefaultOperators;

    IERC1820Registry private _erc1820;

    //these are supposed to be costant but for upgradeability must be initialized into the initializer
    bytes32 private TOKEN_SENDER_INTERFACE_HASH;
    bytes32 private TOKEN_RECIPIENT_INTERFACE_HASH;


    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );
    event Minted(
        address indexed operator,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );
    event Burned(
        address indexed operator,
        address indexed from,
        uint256 amount,
        bytes data,
        bytes operatorData
    );
    event AuthorizedOperator(
        address indexed operator,
        address indexed holder
    );
    event RevokedOperator(address indexed operator, address indexed holder);

    function initialize(
        string memory symbol,
        string memory name,
        address owner,
        address[] memory defaultOperators
    )
    public initializer
    {
        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = 1;
        _owner = owner;
        _emergencyDelegate = _owner;
        _defaultOperatorsArray = defaultOperators;

        for (uint256 i=0; i<defaultOperators.length; i++) {
            _defaultOperators[defaultOperators[i]] = true;
        }

        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        TOKEN_SENDER_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
        TOKEN_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensSender");

        _erc1820.setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
        //_erc1820.setInterfaceImplementer(address(this), keccak256("ERC20Token"), address(this));
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

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function granularity() external view returns (uint256) {
        return _granularity;
    }

    function balanceOf(address who) external view returns (uint256) {
        return _balances[who];
    }

    function defaultOperators() external view returns (address[] memory) {
        return _defaultOperatorsArray;
    }

    function isOperatorFor(address operator, address holder) external view returns (bool) {
        return holder == operator ||
            (_defaultOperators[operator] && !_revokedDefaultOperators[operator][holder]) ||
            _operators[operator][holder];
    }

    function decimals() external pure returns (uint256) {
        return 18;
    }

    function authorizeOperator(address operator) external {
        require(msg.sender != operator, "The sender must always be his own operator");

        if(_defaultOperators[operator]) {
            _revokedDefaultOperators[msg.sender][operator] = false;
        } else {
            _operators[msg.sender][operator] = true;
        }

        emit AuthorizedOperator(operator, msg.sender);
    }

    function revokeOperator(address operator) external {
        require(msg.sender != operator, "You cannot revoke yourself your own rights");

        if(_defaultOperators[operator]){
            _revokedDefaultOperators[msg.sender][operator];
        } else {
            _operators[msg.sender][operator] = false;
        }

        emit RevokedOperator(operator, msg.sender);
    }

    function burn(uint256 amount, bytes calldata data) external {
        _burn(msg.sender, msg.sender, amount, data, "");
    }

    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    )
        external
    {
        //being isOperatorFor external the compiler doesn't sees it without `this`
        require(this.isOperatorFor(msg.sender, from), "Caller is not an hoperator for the specified holder");

        _burn(msg.sender, from, amount, data, operatorData);

    }

    function send(address recipient, uint256 amount, bytes calldata data) external {
        _send(msg.sender, msg.sender, recipient, amount, data, "", true);
    }

    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    )
        external
    {
        //being isOperatorFor external the compiler doesn't sees it without `this`
        require(this.isOperatorFor(msg.sender, from), "Caller is not operator for specified holder");

        _send(msg.sender, from, to, amount, data, operatorData, true);

    }

    //always called in case of transfer
    /**
     * @param requireInterface if true, contract recipients are required to implement ERC777Recipient
     * it's always true in case of ERC777 while false for ERC20 tokens
     */
    function _send(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData,
        bool requireInterface
    )
        private
    {
        require(from != address(0), "You cannot send from the zero address");
        require(to != address(0), "You cannot send to the zero address");

        //call ERC1820 registry hooks before and after the token state is updated
        callTokensToSend(operator, from, to, amount, data, operatorData);

        updateTokenState(operator, from, to, amount, data, operatorData);

        callTokensReceived(operator, from, to, amount, data, operatorData, requireInterface);
    }

    //always called in case of burn
    function _burn(
        address operator,
        address from,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    )
        private
    {
        require(from != address(0), "You cannot burn tokens of address 0");

        callTokensToSend(operator, from, address(0), amount, data, operatorData);

        _totalSupply = _totalSupply.sub(amount);
        _balances[from] = _balances[from].sub(amount);

        emit Burned(operator, from, amount, data, operatorData);
    }

    function updateTokenState(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    )
        private
    {
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);

        emit Sent(operator, from, to, amount, data, operatorData);
    }

    function callTokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    )
        private
    {
        /**
          * if `from` has registered a ERC777Recipient to the registry
          * the tokensToSend hook of that contract must be called before
          * updating the state
        */

        address implementer = _erc1820.getInterfaceImplementer(from, TOKEN_SENDER_INTERFACE_HASH);
        if(implementer != address(0)) {
            ERC777Sender(implementer).tokensToSend(operator, from, to, amount, data, operatorData);
        }
    }

    function callTokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData,
        bool requireInterface
    )
        private
    {
        //query the registry to retrieve recipient registered interface
        address implementer = _erc1820.getInterfaceImplementer(to, TOKEN_RECIPIENT_INTERFACE_HASH);
        if(implementer != address(0)) {
            ERC777Recipient(implementer).tokensReceived(operator, from, to, amount, data, operatorData);
        } else if (requireInterface) {
            require(!to.isContract(), "The recipient contract must implement the ERC777TokensRecipient interface");
        }
    }

    function isContract(address addr) internal view returns (bool) {
        uint256 length;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(addr)
        }
        return (length > 0);
    }

}
