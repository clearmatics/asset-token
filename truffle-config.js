const GAS = 10000000
const KeystoreProvider = require("truffle-keystore-provider")
const PrivateKeyProvider = require("truffle-privatekey-provider")
const HDWalletProvier = require("@truffle/hdwallet-provider")

const GAS_PRICE = 10000000000000

const privateKeys = require("./accounts")

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      gas: GAS,
      network_id: "*"
    },
    testnet: {
      provider: new HDWalletProvier({
        privateKeys, 
        providerOrUrl: "https://temp-rpc.testnet.autonity.network:8545/", 
        numberOfAddresses: privateKeys.length,
        shareNonce: false
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
