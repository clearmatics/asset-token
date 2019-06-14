# Asset Token

[![Build Status](https://travis-ci.org/clearmatics/asset-token.svg?branch=master)](https://travis-ci.org/clearmatics/asset-token)

Designed to represent a fungible asset with offchain interaction 

## Features

- Supports the [ERC223][1] token standard.
- Upgradeable via integration with [ZeppelinOS][7].
- Emergency stop to prevent transfers. 

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
    npx zos session --network development --from <address>

This will start a session to work with in the network. --from flag is optional

    npx zos push --deploy-dependencies

This will compile and deploy contracts from zos.json and dependencies to the local network. --deploy flag not needed if running in public testnets (Rinkeby, Kovan, Ropsten) or mainnet.

    yarn test

This will run tests

## Deploy Asset Token (ready to use with wallet)

```
npm install
./run_private_accounts_ganache.sh
```

This will deploy Asset Token and fund accounts

[1]: https://github.com/ethereum/EIPs/issues/223
[2]: http://truffleframework.com/
[3]: https://nodejs.org/
[4]: https://yarnpkg.com/en/docs/install
[5]: https://docs.npmjs.com/getting-started/installing-node
[7]: https://zeppelinos.org/
