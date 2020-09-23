const GAS = 10000000
const KeystoreProvider = require("truffle-keystore-provider")
const PrivateKeyProvider = require("truffle-privatekey-provider")
const HDWalletProvier = require("@truffle/hdwallet-provider")

const GAS_PRICE = 10000000000000

// the hd wallet provider allows to unlock multiple accounts
const privateKeys = [
  "6def495775234de1a31e3e777bcef596d80296fce26e1b869ade84937a1927f9"
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
      provider: () => new HDWalletProvier(privateKeys, "http://rpc2.testnet.autonity.io:8545", 0, privateKeys.length),
      gas: GAS,
      gasPrice: GAS_PRICE, 
      network_id: "*",
    },
//    // Replace it for Autonity network
//    development: {
//      provider: () =>  new PrivateKeyProvider(PRIVATE_KEY, AUTONITY_RPC),
//      gas: GAS,
//      gasPrice: GAS_PRICE,
//      network_id: NETWORK_ID
//    },
//    Replace it for Autonity network with keystore provider
//    development: {
//      provider: new KeystoreProvider(AUTONITY_RPC, PATH_TO_KEYSTORE_FILE, OPTIONAL_PASSWORD),
//      gas: GAS,
//      gasPrice: GAS_PRICE,
//      network_id: NETWORK_ID
//  },
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
