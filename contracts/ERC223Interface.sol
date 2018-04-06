pragma solidity ^0.4.19;

contract ERC223Interface {
    function balanceOf(address who) public constant returns (uint);

  
    function name() public view returns (string);
    function symbol() public view returns (string);
    function decimals() public view returns (uint8);
    function totalSupply() public view returns (uint256);

    function transfer(address to, uint value) public returns (bool);
    function transfer(address to, uint value, bytes data) public returns (bool);
    function transfer(address to, uint value, bytes data, string custom_fallback) public returns (bool);

    event Transfer(address from, address to, uint value, bytes data);
}
