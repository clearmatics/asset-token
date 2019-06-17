pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/introspection/IERC1820Registry.sol";
import "openzeppelin-solidity/contracts/token/ERC777/IERC777.sol";
import "openzeppelin-eth/contracts/utils/Address.sol";
import "zos-lib/contracts/Initializable.sol";

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

    IERC1820Registry private _erc1820;

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

    function initialize(string memory symbol, string memory name, address owner) public initializer {
        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = 1;
        _owner = owner;
        _emergencyDelegate = _owner;

         _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

        /**
         * @dev Sets the contract which implements a specific interface for an address.
         * function setInterfaceImplementer(address _addr, bytes32 _interfaceHash, address _implementer) external
         * @param _addr: address for which to set the interface (msg.sender default)
         * @param _interfaceHash: Keccak256 hash of the name of the interface
         * @param _implementer: contract implementing _interfaceHash for _addr
        */
        _erc1820.setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
        _erc1820.setInterfaceImplementer(address(this), keccak256("ERC20Token"), address(this));
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

    function decimals() external pure returns (uint256) {
        return 18;
    }


}
