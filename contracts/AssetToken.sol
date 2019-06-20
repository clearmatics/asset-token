pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-eth/contracts/utils/Address.sol";
import "zos-lib/contracts/Initializable.sol";
import "./IERC777Recipient.sol";
import "./IERC777Sender.sol";

contract AssetToken is IERC777, Initializable {
    using SafeMath for uint256;
    using Address for address;

    string public _name;
    string public _symbol;
    uint256 public _totalSupply;
    uint256 public _granularity;

    address private _owner;
    address private _emergencyDelegate;
    address private _fundingDelegate;
    bool private _isActive;

    mapping(address => uint256) private _balances;

    //must be immutable
    address[] private _defaultOperatorsArray;
    mapping(address => bool) private _defaultOperators;

    // maps operators and revoked default ones to each account
    mapping(address => mapping(address => bool)) private _operators;
    mapping(address => mapping(address => bool)) private _revokedDefaultOperators;

    IERC1820Registry private _erc1820;

    //these are supposed to be costant but for upgradeability must be initialized into the initializer
    bytes32 private TOKENS_SENDER_INTERFACE_HASH;
    bytes32 private TOKENS_RECIPIENT_INTERFACE_HASH;


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
    event EmergencyDelegation(address indexed member);
    event FundingDelegation(address indexed member);
    event Switch(bool balance);
    event Fund(address indexed member, uint256 value, uint256 balance);

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
        _fundingDelegate = _owner;
        _isActive = true;
        _defaultOperatorsArray = defaultOperators;

        for (uint256 i=0; i<defaultOperators.length; i++) {
            _defaultOperators[defaultOperators[i]] = true;
        }

        //the address of the registry is universally costant
        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        TOKENS_SENDER_INTERFACE_HASH =
            0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895;
        TOKENS_RECIPIENT_INTERFACE_HASH =
            0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b;

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

    modifier onlyEmergencyAccount() {
        if (msg.sender != _emergencyDelegate){
            revert("This account is not allowed to do this");
        }
        _;
    }

    modifier onlyFundingAccount() {
        if(msg.sender != _fundingDelegate) {
            revert("This account is not allowed to do this");
        }
        _;
    }

    modifier checkActive() {
        if(_isActive != true) {
            revert("Contract emergency stop is activated");
        }
        _;
    }

    modifier noOwnerAsCounterparty(address counterparty) {
        if (counterparty == _owner || counterparty == _fundingDelegate || counterparty == _emergencyDelegate) {
            revert("The contract owner can not perform this operation");
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

    function getTradingStatus() external view returns (bool) {
        return _isActive;
    }

    function isOperatorFor(address operator, address holder) external view returns (bool) {
        return holder == operator ||
            (_defaultOperators[operator] && !_revokedDefaultOperators[holder][operator]) ||
            _operators[holder][operator];
    }

    function decimals() external pure returns (uint256) {
        return 18;
    }

    function authorizeOperator(address operator) external {
        require(msg.sender != operator, "The sender is already his own operator");

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
            _revokedDefaultOperators[msg.sender][operator] = true;
        } else {
            _operators[msg.sender][operator] = false;
        }

        emit RevokedOperator(operator, msg.sender);
    }

    function setEmergencyPermission(address who) external onlyOwner {
        _emergencyDelegate = who;
        emit EmergencyDelegation(_emergencyDelegate);
    }

    function revokeEmergencyPermission() external onlyOwner {
        _emergencyDelegate = _owner;
        emit EmergencyDelegation(_emergencyDelegate);
    }

    function setFundingPermission(address who) external onlyOwner {
        _fundingDelegate = who;
        emit FundingDelegation(_fundingDelegate);
    }

    function revokeFundingPermission() external onlyOwner{
        _fundingDelegate = _owner;
        emit FundingDelegation(_fundingDelegate);
    }

    // @dev starts trading by switching _isActive to true
    function emergencyStart() public onlyOwner {
        if (_isActive == false) {
            _isActive = true;
        }
        emit Switch(true);
    }

    // @dev stops trading by switching _isActive to false
    function emergencyStop() public onlyEmergencyAccount {
        if (_isActive == true) {
            _isActive = false;
        }
        emit Switch(false);
    }

    // solhint-disable-next-line no-simple-event-func-name
    function fund(address member, uint256 value)
        public
        onlyFundingAccount
        checkActive
        noOwnerAsCounterparty(member)
    {

        require(member != address(0), "You cannot mint tokens to address 0");

        _balances[member] = _balances[member].add(value);
        _totalSupply = _totalSupply.add(value);

        callTokensReceived(msg.sender, address(0), member, value, "", "", true);

        emit Minted(msg.sender, member, value, "", "");
        emit Fund(member, value, _balances[member]);
    }

    function burn(uint256 amount, bytes calldata data)
        checkActive
        noOwnerAsCounterparty(msg.sender)
        external
    {
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
        require(this.isOperatorFor(msg.sender, from), "Caller is not operator for the specified holder");

        _burn(msg.sender, from, amount, data, operatorData);

    }

    function send(address recipient, uint256 amount, bytes calldata data)
        external
        checkActive
        noOwnerAsCounterparty(recipient)
        noOwnerAsCounterparty(msg.sender)
    {
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

    /**
     * @param requireInterface if true, contract recipients are required to implement ERC777Recipient
     * it's always true in case of ERC777, needed only if we want ERC20 compatibility as well
     * always called for transfer
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

        updateTokenBalances(operator, from, to, amount, data, operatorData);

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

    function updateTokenBalances(
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
        address implementer = _erc1820.getInterfaceImplementer(from, TOKENS_SENDER_INTERFACE_HASH);
        if(implementer != address(0)) {
            IERC777Sender(implementer).tokensToSend(operator, from, to, amount, data, operatorData);
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
        address implementer = _erc1820.getInterfaceImplementer(to, TOKENS_RECIPIENT_INTERFACE_HASH);
        if(implementer != address(0)) {
            IERC777Recipient(implementer).tokensReceived(operator, from, to, amount, data, operatorData);
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
