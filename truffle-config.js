const GAS = 10000000
const KeystoreProvider = require("truffle-keystore-provider")
const PrivateKeyProvider = require("truffle-privatekey-provider")
const HDWalletProvier = require("@truffle/hdwallet-provider")

const GAS_PRICE = 10000000000000

// the hd wallet provider allows to unlock multiple accounts
const privateKeys = [
  // "6def495775234de1a31e3e777bcef596d80296fce26e1b869ade84937a1927f9"
]

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      gas: GAS,
      network_id: "*"
    },
    noise: {
      provider: new HDWalletProvier({
        privateKeys, 
        providerOrUrl: "https://temp-rpc.testnet.autonity.network:8545/", 
        numberOfAddresses: privateKeys.length,
        shareNonce: true
      }),
      gas: GAS,
      gasPrice: GAS_PRICE, 
      network_id: "*",
    },
    soliditycoverage: {
      host: "localhost",
      port: 8555,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.5.3+commit.10d17f24",
      settings: {
        optimizer: {
          enabled: false, // test coverage won't work otherwise
          runs: 200
        },
      },
    },
  },
  plugins: ["solidity-coverage"]
};
