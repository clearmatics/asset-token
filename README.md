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
      AssetToken.initialize(<string>, <string>, <address>, <[address]>, <uint8>, <uint8>);
      //your constructor code
  }

}
```

## Developing

[Truffle][2] is used to develop and test the Asset Token Smart Contract. This has a dependency on [Node.js][3].

Prerequisites:

[yarn][4] (but [npm][5] should work just as well)

    yarn install

This will install all the required packages.

## Testing

Start `ganache` in a separate terminal tab or window.

    yarn ganache

    # in separate window or tab
    npx zos session --network development [--from <address>]

This will start a session to work with in the network. --from flag is optional

    npx zos push --deploy-dependencies [--from <address>]

This will compile and deploy contracts from zos.json and dependencies to the local network. --deploy flag not needed if running in public testnets (Rinkeby, Kovan, Ropsten) or mainnet.

    yarn test

This will run tests

## Deploy Asset Token (ready to use with wallet)

```
npm install
./run_private_accounts_ganache.sh
```

This will deploy Asset Token and fund accounts

[1]: https://eips.ethereum.org/EIPS/eip-777
[2]: http://truffleframework.com/
[3]: https://nodejs.org/
[4]: https://yarnpkg.com/en/docs/install
[5]: https://docs.npmjs.com/getting-started/installing-node
[7]: https://zeppelinos.org/
[8]: http://eips.ethereum.org/EIPS/eip-1820
