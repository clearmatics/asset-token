pragma solidity 0.4.21;


interface ERC20Interface {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function increaseApproval(address spender, uint addedValue) external returns (bool);
    function decreaseApproval(address spender, uint subtractedValue) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
