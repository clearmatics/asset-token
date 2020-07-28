# Asset Token

![ci](https://github.com/clearmatics/asset-token/workflows/Continuous%20Integration/badge.svg)
[![codecov](https://codecov.io/gh/clearmatics/asset-token/branch/master/graph/badge.svg)](https://codecov.io/gh/clearmatics/asset-token)
[![npm version](http://img.shields.io/npm/v/asset-token.svg?style=flat)](https://www.npmjs.com/package/asset-token)

Designed to represent a fungible asset with offchain interaction

## Features

- Supports the [ERC777][1] token standard.
  - Operators (default/elected, contracts/EOA) to transfer and burn tokens on behalf of holder
  - tokensReceived hook function to manage incoming tokens
  - tokensToSend hook function to manage outcoming tokens
  - Makes use of the [ERC1820][8] Pseudo-introspection Registry Contract to avoid token loss
- Upgradeable via integration with [ZeppelinOS][7].
- Emergency stop to prevent transfers
- Support for whitelisting and blacklisting with dynamic switching
- Token granularity to be set upon deployment
- Non compatible with ERC-20 standard

## Install

`npm install asset-token`

## Usage

Import it and extend it through inherithance. Remember to call parent's _initialize_ function in your _initializer_ one
For example:

```
pragma solidity ^0.5.0;

import "asset-token/contracts/AssetToken.sol";
import "zos-lib/contracts/Initializable.sol";

contract myToken is AssetToken {

  function myInitialize() public initializer {
      AssetToken.initialize(<string>, <string>, <address>, <[address]>, <uint8>, <uint8>, <address>);
      //your constructor code
  }

}
```

## Developing

### Prerequisites

This project is developed using Node.js with the following versions 

* node 10.19.0
* npm 6.13.4

It is recommended that [Node Version Manager][9] is used to ensure the correct versions are used. 

    nvm install lts/dubnium
    nvm use lts/dubnium
    Now using node v10.19.0 (npm v6.13.4)

### Dependencies

Install dependencies using [npm][5]

    npm install

This will install all the required packages for developing the Asset Token Contract.

## Testing

Start `ganache` in a separate terminal tab or window.

    npm run ganache

    # in separate window or tab
    npx zos session --network development [--from <address>]

This will start a session to work with in the network. --from flag is optional

    npx zos push --deploy-dependencies [--from <address>]

This will compile and deploy contracts from zos.json and dependencies to the local network. --deploy flag not needed if running in public testnets (Rinkeby, Kovan, Ropsten) or mainnet.

    npm test

This will run tests

## Deploying the Asset Token

The following will guide you through deploying an Asset Token contract.

1. Ensure you have all dependencies installed and are running the supported Node version (10.19.0).

```
npm install
```

2. Declare your network in your `truffle.js` configuration. Documentation on setting up a configuration file may be found [here][10].

```
rinkeby: {
  skipDryRun: true,
  provider: () => new PrivateKeyProvider(PK, nodeURL),
},
```
    
3.  Setup the provider changing `rinkeby` to the name of your network.

```
npx zos session --network rinkeby
```

4. Deploy Contracts and dependencies 

For this you will need the URL of a node on the network and a private key. 

```
npx zos push --deploy-dependencies -- --privateKey <pk> --nodeURL <url>
```

`--deploy-dependencies` is only needed only at first deployment on that network 
 
5. Create proxy and call Asset Token constructor 

To initialise the contract pass arguments as follows

* symbol (string) - the symbol for the token
* name (string) - the name of the token
* owner (address) - the owner of the contract
* defaultOperators (array of addresses) - addresses that may operate on behalf of users
* status (int) - the status of permissioning
  * 0 - No blacklisting or whitelisting
  * 1 - Use blacklisting
  * 2 - Use whitelisting
* granularity (uint256) - The granularity allowed on the token
* registry1820Addr (address) - The address of the ERC1820 registry contract the token will use. Pass a zero address (like in the example below) to use the default one at `0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24`

```
npx zos create AssetToken --init --args "FOO","foo","0x3C1d78EC2bB4415dC70d9b4a669783E77b4a78d0","[]",0,1,"0x0000000000000000000000000000000000000000" -- --privateKey <pk> --nodeURL <url>

```

If successful you will see output as follows

    Using session with network rinkeby, timeout 600 seconds
    Deploying new ProxyAdmin...
    Deployed ProxyAdmin at 0x874a1E79102578bb627F2A7941a2424be345eb31
    Creating proxy to logic contract 0x4A02475b91BB49b2Cb7A4f5b730E7E87bF73712A and initializing by calling initialize with:
    - symbol (string): "FOO"
    - name (string): "foo"
    - owner (address): "0x3C1d78EC2bB4415dC70d9b4a669783E77b4a78d0"
    - defaultOperators (address[]): []
    - status (int256): "0"
    - granularity (uint256): "1"
    - registry1820Addr (address): "0x0000000000000000000000000000000000000000"
    Instance created at 0xe7997c19641246B64688893939C76b2AE2296D42
    0xe7997c19641246B64688893939C76b2AE2296D42
    Updated zos.rinkeby.json

The deployment is complete. Examine the `zos.rinkeby.json` file for all information on the deployment. 

If you wish to interact with the contract you can use the truffle console.

    npx truffle console --network rinkeby  -- --privateKey <pk> --nodeURL <url> 

This will place you into a console. Get the proxy contract address to interact with it. 

    token = await AssetToken.at("0xe7997c19641246B64688893939C76b2AE2296D42")

It is then possible to call contract functions

    token.name()
    'foo'

A funding operation looks like

    var fund = await token.fund("0xD079Bd77bF485908e145C8A54d5086c10b9868c3", 10000)

If successful you can examine the transaction receipt.

    fund

Then verify the balance

    var balance = await token.balanceOf("0xD079Bd77bF485908e145C8A54d5086c10b9868c3")
    balance.toString()
    '10000'

## Docker


* build:
  ```
  docker build -t clearmatics/asset-token .
  ```
* Run Ganache network
  ```
  docker run -d -p 8545:8545 --name ganache trufflesuite/ganache-cli:v6.9.1 --gasLimit 0xFFFFFFFF
  ```
* Deploy contracts to default `development` network:
  ```
  # Deploy ERC1820 for Ganache network if not exist
  ERC1820_ADDR=$(docker run --network="host" eastata/erc1820-registry:v1.0.0 |grep "contract address" |grep -Eo '0x[a-fA-F0-9]{40}')
  
  # Deploy and initialize Asset Token
  docker run --network="host" -t clearmatics/asset-token \
    deploy "--" \
    "GBP,sterling,0x3C1d78EC2bB4415dC70d9b4a669783E77b4a78d0,[],0,1,${ERC1820_ADDR}"
  ```
* Run Tests
  ```
  docker run --network="host" -t clearmatics/asset-token test
  ```
* Run Coverage
  ```
  echo "" > coverage.json
  docker run -v "$(pwd)"/coverage.json:/app/coverage.json --network="host" -ti clearmatics/asset-token coverage
  ```
* Connect to ssh-forvarded network and deploy using custom truffle config
  ```
  # Deploy ERC1820 if not exist
  ERC1820_ADDR=$(docker run -v "$(pwd)"/truffle-config.js:/app/truffle-config.js --network="host" eastata/erc1820-registry:v1.0.0 |grep "contract address" |grep -Eo '0x[a-fA-F0-9]{40}')

  # Deploy and initialize Asset Token
  docker run -v "$(pwd)"/truffle-config.js:/app/truffle-config.js --network="host" -ti clearmatics/asset-token \
    deploy "--" \
    "GBP,sterling,0x3C1d78EC2bB4415dC70d9b4a669783E77b4a78d0,[],0,1,${ERC1820_ADDR}"
  ```

[1]: https://eips.ethereum.org/EIPS/eip-777
[2]: http://truffleframework.com/
[3]: https://nodejs.org/
[4]: https://yarnpkg.com/en/docs/install
[5]: https://docs.npmjs.com/getting-started/installing-node
[7]: https://zeppelinos.org/
[8]: http://eips.ethereum.org/EIPS/eip-1820
[9]: https://github.com/nvm-sh/nvm
[10]: https://www.trufflesuite.com/docs/truffle/reference/configuration
