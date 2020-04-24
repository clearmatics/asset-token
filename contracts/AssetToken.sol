//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

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

    enum ListStatus {NoFilter, Blacklist, Whitelist}
    ListStatus private _listStatus;

    string private _name;
    string private _symbol;
    uint256 private _totalSupply;
    uint256 private _granularity;

    address private _owner;
    address private _emergencyDelegate;
    address private _fundingDelegate;
    address private _listsController;
    bool private _isActive;

    mapping(address => uint256) private _balances;

    mapping(address => bool) private _isBlacklisted;
    mapping(address => bool) private _isWhiteListed;

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

    event EmergencyDelegation(address indexed member);
    event FundingDelegation(address indexed member);
    event Switch(bool balance);
    event Fund(address indexed member, uint256 value, uint256 balance);
    event ListDelegation(address indexed member);
    event Denied(address indexed who, ListStatus status);
    event Allowed(address indexed who, ListStatus status);
    event SwitchListStatus(ListStatus status);

    function initialize(
        string calldata symbol,
        string calldata name,
        address owner,
        address[] calldata defaultOperators,
        int status,
        uint256 granularity,
        address registry1820Addr
    )
    external initializer
    {
        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = granularity;
        _owner = owner;
        _emergencyDelegate = _owner;
        _fundingDelegate = _owner;
        _listsController = _owner;
        _isActive = true;
        _listStatus = ListStatus(status);
        _defaultOperatorsArray = defaultOperators;

        for (uint256 i=0; i<defaultOperators.length; i++) {
            _defaultOperators[defaultOperators[i]] = true;
        }

        // override the default address of the registry with the one provided if provided
        if (registry1820Addr != address(0)) {
            _erc1820 = IERC1820Registry(registry1820Addr);
        } else {
            _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        }

        // if the token sender has implemented the interface call its hook - optional 
        TOKENS_SENDER_INTERFACE_HASH =
            0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895;

        // if the token recipient is a contract and hasn't registered the interface the call reverts 
        TOKENS_RECIPIENT_INTERFACE_HASH =
            0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b;

        // tells the registry this contract implements for itself the erc777 interface
        _erc1820.setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
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
        if (msg.sender != _fundingDelegate) {
            revert("This account is not allowed to do this");
        }
        _;
    }

    modifier onlyListsController() {
        if (msg.sender != _listsController) {
            revert("This account is not allowed to do this");
        }
        _;
    }

    modifier onlyAllowedAddress(address who) {
        //the check only if either white or blacklisting
        if (_listStatus != ListStatus.NoFilter) {
            require(_isAllowedToSend(who), "This account is not allowed to send money");
            _;
        } else {
            _;
        }

    }

    modifier onlyWithListFilter() {
        require(_listStatus != ListStatus.NoFilter, "You must do either in white or black listing status");
        _;
    }

    modifier checkActive() {
        if (_isActive != true) {
            revert("Contract emergency stop is activated");
        }
        _;
    }

    modifier noOwnerAsCounterparty(address counterparty) {
        if (counterparty == _owner ||
            counterparty == _fundingDelegate ||
            counterparty == _emergencyDelegate ||
            counterparty == _listsController)
        {
            revert("The contract owner can not perform this operation");
        }
        _;
    }

    modifier checkGranularity(uint amount) {
        require(_isMultipleOfGranularity(amount), "The amount must be a multiple of granularity");
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

    function getListStatus() external view returns (ListStatus) {
        return _listStatus;
    }

    function decimals() external pure returns (uint256) {
        return 18;
    }

    function denyAddress(address who) external onlyListsController onlyWithListFilter {
        if (_listStatus == ListStatus.Blacklist) {
            _isBlacklisted[who] = true;
        } else {
            _isWhiteListed[who] = false;
        }

        emit Denied(who, _listStatus);
    }

    function allowAddress(address who) external onlyListsController onlyWithListFilter {
        if (_listStatus == ListStatus.Blacklist) {
            _isBlacklisted[who] = false;
        } else {
            _isWhiteListed[who] = true;
        }

        emit Allowed(who, _listStatus);
    }

    function switchListStatus(uint8 status) external onlyListsController {
        _listStatus = ListStatus(status);
        emit SwitchListStatus(_listStatus);
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

    function setFundingPermission(address who) external onlyOwner {
        _fundingDelegate = who;
        emit FundingDelegation(_fundingDelegate);
    }

    function setListsController(address who) external onlyOwner {
        _listsController = who;
        emit ListDelegation(_listsController);
    }

    function isAllowedToSend(address who) external view returns (bool) {
        return _isAllowedToSend(who);
    }

    function isOperatorFor(address operator, address holder) external view returns (bool) {
        return _isOperatorFor(operator, holder);
    }

    function isMultipleOfGranularity(uint amount) external view returns (bool) {
        return _isMultipleOfGranularity(amount);
    }

    // @dev starts trading by switching _isActive to true
    function emergencyStart() external onlyEmergencyAccount {
        if (_isActive == false) {
            _isActive = true;
        }
        emit Switch(true);
    }

    // @dev stops trading by switching _isActive to false
    function emergencyStop() external onlyEmergencyAccount {
        if (_isActive == true) {
            _isActive = false;
        }
        emit Switch(false);
    }

    // solhint-disable-next-line no-simple-event-func-name
    function fund(address member, uint256 value)
        external
        onlyFundingAccount
        checkActive
        checkGranularity(value)
        noOwnerAsCounterparty(member)
    {

        require(member != address(0), "You cannot mint tokens to address 0");

        _balances[member] = _balances[member].add(value);
        _totalSupply = _totalSupply.add(value);

        callTokensReceived(msg.sender, address(0), member, value, "", "");

        emit Minted(msg.sender, member, value, "", "");
        emit Fund(member, value, _balances[member]);
    }

    function burn(uint256 amount, bytes calldata data)
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
        require(_isOperatorFor(msg.sender, from), "Caller is not operator for the specified holder");

        _burn(msg.sender, from, amount, data, operatorData);

    }

    function send(address recipient, uint256 amount, bytes calldata data)
        external
    {
        _send(msg.sender, msg.sender, recipient, amount, data, "");
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
        require(_isOperatorFor(msg.sender, from), "Caller is not operator for specified holder");

        _send(msg.sender, from, to, amount, data, operatorData);

    }


    //always called for transfer
    function _send(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    )
        private
        checkActive
        checkGranularity(amount)
        noOwnerAsCounterparty(from)
        noOwnerAsCounterparty(to)
        noOwnerAsCounterparty(operator)
        onlyAllowedAddress(from)
        onlyAllowedAddress(operator)
    {
        require(from != address(0), "You cannot send from the zero address");
        require(to != address(0), "You cannot send to the zero address");

        //call ERC1820 registry hooks before and after the token state is updated
        callTokensToSend(operator, from, to, amount, data, operatorData);

        updateTokenBalances(operator, from, to, amount, data, operatorData);

        callTokensReceived(operator, from, to, amount, data, operatorData);
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
        checkActive
        checkGranularity(amount)
        noOwnerAsCounterparty(operator)
        noOwnerAsCounterparty(from)
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
          * if `from` has registered a ERC777Sender interface to the registry
          * the tokensToSend hook of that contract is called -
          * it's then optional for an account to implement it
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
        bytes memory operatorData
    )
        private
    {
        /**
          * if `to` has registered a ERC777Recipient to the registry
          * the tokensReceived hook of that contract is called -
          * optional for EOA mandatory for contracts
        */
        address implementer = _erc1820.getInterfaceImplementer(to, TOKENS_RECIPIENT_INTERFACE_HASH);
        if(implementer != address(0)) {
            IERC777Recipient(implementer).tokensReceived(operator, from, to, amount, data, operatorData);
        } else {
            require(!isContract(to), "The recipient contract must implement the ERC777TokensRecipient interface");
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

    function _isAllowedToSend(address who) internal view returns (bool) {
        if (_listStatus == ListStatus.Blacklist) {
            return !_isBlacklisted[who];
        } else if (_listStatus == ListStatus.Whitelist) {
            return _isWhiteListed[who];
        }

        return true;
    }
    
    function _isOperatorFor(address operator, address holder) internal view returns (bool) {
        return holder == operator ||
            (_defaultOperators[operator] && !_revokedDefaultOperators[holder][operator]) ||
            _operators[holder][operator];
    }

    function _isMultipleOfGranularity(uint amount) internal view returns (bool) {
        return (amount % _granularity == 0);
    }
}
