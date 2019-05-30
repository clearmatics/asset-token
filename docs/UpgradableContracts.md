# Upgradable Smart Contracts

# Contents

- [Introduction](#introduction)
- [Proxy Patterns](#proxy-patterns)
- [Security Issues](#security-issues)
- [Setting Up A Project](#setting-up-a-project)
- [Testing](#testing)

# Introduction

This documentation aims at making life easier when dealing with upgradable smart Contracts, as we may need them for future implementations. I've collected materials and documentation from many different sources and here I try to condense them in a single one.

This feature is part of the [ZeppelinOS](https://zeppelinos.org/) project, forked from the well-known openzeppelin. They provide a set of features that would improve the smart contract development experience, such as on-chain packages and libraries, state channels, trusted oracles, other than ZepKit - a toolkit that encapsulates Truffle, Infura, OpenZeppelin, and ZeppelinOS.
So we rely on ZeppelinOS both for the documentation i provide here, and on the implementation.

# Proxy Patterns

Clearly it is not possbile to change the code of an already deployed smart contract, so the trick is to set-up a proxy contract that gets all message calls from the outside world and redirects them to the latest deployed contract logic. In Ethereum this is possible thanks to the **delegatecall** opcode. One thing to bear in mind with this opcode is that the code of the callee contract is executed in the context of the caller one, so that the application's state is the proxy one. Furthermore context variable such as `msg.sender` or `msg.value` will be still related to the account calling the proxy.

The proxy contract needs at least to keep track of the latest logic contract address, as well as a function to update it. Governance mechanism are another feature that it may as well have. It is very critical then to consider storage management, since all logic contracts will update the proxy state instead of theirs, so to avoid overwriting previous state and proxy variables.

[Here](https://blog.zeppelinos.org/proxy-patterns/) you find a more thorough description of the different patterns and related storage management, and more low-level info about the basic proxy functionality.

# Security Issues

The major caveats when dealing with such architecture are surely related to storage management, both to preserve the state during subsequent updates of logic and to avoid storage collision with proxy variables.

## Storage Collision With Proxy

The first concern is how to make sure that proxy variables (i.e. proxy owner, current logic address) don't get overwritten by the application state. Imagine the `address _implementation` variable in the proxy contract, and `address _owner` being the first variable of the logic contract.
Both variables are 32 byte size, so they would be stored in the first storage slot by the EVM. Indeed, when the logic contract writes to `_owner`, it would do that within the proxy's state, thus overwriting `_implementation`.

The solution adopted by ZeppelinOS is the so called **unstructured storage**, where proxies variable are assigned to a pseudo random storage slot, so the probability of a logic contract declaring a variable at the same slot is negligible, like in this example:
`bytes32 private constant implementationPosition = keccak256("org.zeppelinos.proxy.implementation");`

As a result, logic contract doesn't have to care about proxy's variable and viceversa.

## Storage Collision Betweeen Implementations

The aforementioned approach avoids storage collision between logic and proxy, but can't avoid collisions between subsequent logic contracts. In order to avoid that, new versions of a logic contract should either extend previous versions or only append new variables to the storage hierarchy. Fortunately, ZeppelinOS CLI detects when such collision could happen and warns.

## Constructor Caveat

Code inside a constructor in Solidity is executed only once during its deployment and as such isn't included in the contract's bytecode. This means that the code within the constructor will never be executed in the context of the proxy's state.
In order to avoid this, constructor code of the logic contract must be moved inside an _initializer_ function, as the one below:

```
import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  function initialize(address arg1, uint256 arg2, bytes arg3) initializer public payable {
  // "constructor" code...
  }

}
```

As for regular constructor, we need that the function is called only once, and the _initializer_ modifier from _Initializable_ library covers that. Besides, differently from constructor functions, here you need to take special care to manually call the initializers of all parent contracts.
Within the same context is also the value initialization in field declarations. As in the example below, setting a variable value in its declaration is like setting it in the costructor, and as such will be ignored by the proxy. Make sure then that all initial values are set in an _initializer_ function.

```
contract MyContract {
  uint256 public hasInitialValue = 42;
}
```

## Function clashes

Another thing consider when writing and testing this contracts is the possibility of function clashes.
This scenario might come true when proxy and logic contracts have functions with the same name, or generally with the same 4-byte signature.
This lead to a [vulnerability](https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357) discovered that can be exploited to create backdoors inside proxy contracts.

The solidity compiler usually tracks when such function collisions happen within the same contract, but not among different ones, like in this case. When a function is called and is present in both contracts, which one should be executed?
ZeppelinOS deals with this problem through the so called _transparent proxy_ pattern, who will decide which calls to delegate based on the caller address, `msg.sender`.

- If the caller is proxy admin, the proxy will not delegate any calls, thus responding only to messages it understands.
- Otherwise the call will be always delegated, no matter if it matches one of the logic functions.

# Setting Up A Project

In order to set ZeppelinOS up in our project, assuming that this is already a truffle project, run:
`npm install zos`

To make use of the ZeppelinOS Javascript Library, for example needed to use the _initializer_ modifier, run:
`npm install zos-lib`

Finally, initialize a ZeppelinOS project by:
`npx zos init project-name`

This will create a `zos.json` file, containing all the information related to the ZeppelinOS project. [Here](https://docs.zeppelinos.org/docs/configuration.html#zosjson) a more detailed explanation of this file.

## Add a contract

There are just few changes to be done to make a contract upgradable, namely:

- Make use of _initializer_ function instead of constructor, explained [here](#constructor-caveat)
- Use upgradable libraries. For example contracts previously belonging to `openzeppelin-solidity` must be imported from [openzeppelin-eth](https://github.com/OpenZeppelin/openzeppelin-eth) now.

When the contract code is ready, we can add it to the project with:
`npx zos add ContractName`

It will compile the contract with truffle, add it to the project, upgrading the `zos.json` configuration file.

## Deploy the Project

Assuming that a blockchain network is running, run:
`npx zos session --network <network_name> --from <account_address> --expires 3600`

This command starts a session to work with in the network, setting a default address for future transactions you run, as well as other configuration params.

ZeppelinOS allows us to link packages that have been already deployed to the blockchain, instead of wasting resources deploying them again every time we need them in a project. If your contract imports some of them, make sure that you link these dependencies to the project calling:

`npx zos link openzeppelin-eth`

This command will install the openzeppelin-eth contracts locally, which is needed to compile the contracts that import it; but it will also update the zos.json file with a reference to the linked package to make sure that when you deploy the project it will use the EVM package that already exists on the blockchain.

Now you can deploy the whole project with:
`npx zos push`

If you are using a test blockchain, also package dependencies (i.e. `openzeppelin-eth`) need to be deployed. This is done by adding `--deploy-dependencies` to the `push` command. If using notorious testnets or mainnet, those will be already deployed and you can skip that flag.

This command deploys `ContractName` and all the other contracts in the `zos.json` to the specified network, returning their addresses. Besides, it creates a `zos.dev-<network_id>.json` file with all the information of the project in this specific network. More info about this file [here](https://docs.zeppelinos.org/docs/configuration.html#zos-network-json).

An important thing to understand is that here we are deploying the logic contracts, not the proxy one.

## Deploy a Proxy

Once we have deployed the logic, the proxy, which we will always interact with, is created with:
`npx zos create ContractName --init <initialize_function_name> --args <list_of_arguments>`

As you can see, we need to specify the _initializer_ function name we used in our logic contract as constructor (usually just `initialize`) and the argument it takes, as a comma-separated list with no spaces in between. The actual initialisation of logic variables takes place here.

The command will update the `zos.dev-<network_id>.json` file with the proxy contract address.

## Upgrade Logic

After having modified the logic contract, taking care of the few [caveats](#security-issues), push it to the network with:
`npx zos push`

And finally update the proxy's pointer to the latest logic with:
`npx zos update ContractName`

You will still interact with the address returned by the `create` command above, the proxy's one.

If our modification affects the _initializer_ function in the contract, because of a new variable which needs to be set, we can specify the modification inside the function. That would be fine for newly deployed instances of it, but it wouldn't work for one that has already been deployed, and is instead being updated.

Instead, we will need to specify only the new initialization values within a new function, let's say `initializeV2`, and specify it in the `update` command as such:
`npx zos update ContractName --init initializeV2 --args <list>`

## Testing

As long as testing, ZeppelinOS provides specifically designed tools for testing your contracts with the exact set of conditions that they would have in production. The bare bone structure of a test file should contain the followings:

```
const { TestHelper } = require("zos");
const { Contracts, ZWeb3 } = require("zos-lib");

ZWeb3.initialize(web3.currentProvider);

const AssetToken = Contracts.getFromLocal("AssetToken");

```

- `TestHelper` facilitates the creation of a project object that will set up the entire ZeppelinOS project within a test environment
- `Contracts` and `ZWeb3` help us retrieve compiled contract artifacts and to set up our Web3 provider to ZeppelinOS

The beforeEach clause should then contain at least:

```
beforeEach(async () => {
  PROJECT = await TestHelper({ from: proxyOwner });

  PROXY = await PROJECT.createProxy(AssetToken, {
    initMethod: "initialize",
    initArgs: ["CLR", "Asset Token", addrOwner]
  });
});
```

Here we retrieve the project structure and create a proxy instance to our logic. Finally we interact with the logic contract always through the PROXY, by using their methods object. This is because ZeppelinOS uses Web3 1.0 Contract interface. So for example:

`const name = await PROXY.methods.name().call();`
