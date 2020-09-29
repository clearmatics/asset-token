const GAS = 10000000

// Replace it for Autonity network
// const PrivateKeyProvider = require("truffle-privatekey-provider");
// const KeystoreProvider = require("truffle-keystore-provider")
// const PRIVATE_KEY = "766a8043f468c1bf574107160dc470eb1e0838a2fde35449b76e8504054f61af"
// const PATH_TO_KEYSTORE_FILE = ""
// const AUTONITY_RPC = "https://rpc.testnet.autonity.io:8545"
// const GAS_PRICE = 10000000000000
// const NETWORK_ID = 444900

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      gas: GAS,
      network_id: "*"
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
