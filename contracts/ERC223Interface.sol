pragma solidity 0.4.21;


interface ERC223Interface {
    function name() external view returns (string);
    function symbol() external view returns (string);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address addr) external view returns (uint);

    function transfer(address to, uint value) public returns (bool);
    function transfer(address to, uint value, bytes data) public returns (bool);
    function transfer(address to, uint value, bytes data, string customFallback) public returns (bool);
    
    // solhint-disable-next-line no-simple-event-func-name
    event Transfer(address from, address to, uint value, bytes data);
}
