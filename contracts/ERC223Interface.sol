pragma solidity ^0.4.19;

contract ERC223Interface {
    function balanceOf(address who) public constant returns (uint);
    function transfer(address to, uint value) public;
    function transfer(address to, uint value, bytes data) public;

    event Transfer(address from, address to, uint value, bytes data);
}
