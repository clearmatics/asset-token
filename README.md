# Asset Token

[![Build Status](https://travis-ci.com/clearmatics/asset-token.svg?token=ybN3xFwE4whSpdqtVYux&branch=master)](https://travis-ci.com/clearmatics/asset-token)

Designed to represent a fungible asset with offchain interaction as an [ERC223][1] token.

## Developing

[Truffle][2] is used to develop and test the Asset Token Smart Contract. This has a dependency on [Node.js][3].

Prerequisites:

[yarn][4] (but [npm][5] should work just as well) and [solidity-coverage ][6] needs to be installed.

    yarn install

This will install all the required packages.

## Testing

Start `testrpc` in a separate terminal tab or window.

    yarn testrpc
    
    # in separate window or tab
    yarn test

This will compile the contract, deploy to the testrpc instance and run the tests. 

    yarn coverage

this will produce a test coverage report 

[1]: https://github.com/ethereum/EIPs/issues/223
[2]: http://truffleframework.com/
[3]: https://nodejs.org/
[4]: https://yarnpkg.com/en/docs/install
[5]: https://docs.npmjs.com/getting-started/installing-node
[6]: https://www.npmjs.com/package/solidity-coverage



