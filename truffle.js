var Web3 = require("web3");
var PrivateKeyProvider = require("truffle-privatekey-provider");
const { getArgument } = require('./utils_deployment')
const network = getArgument("--network") || undefined
let nodeURL = getArgument("--nodeURL") || "https://34.89.31.11:8545"
let PK = getArgument("--privateKey") || "424064f8e632c125b939d6190f364cdfd8763a06f344090b93d8d640194a429e"

module.exports = {
  networks: {

    //this is for platformx2 
    autonity: {
      skipDryRun: true,
      provider: () => new PrivateKeyProvider(PK, nodeURL),
      network_id: "*" // Match any network id
    },

    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },

  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    version: "0.5.3+commit.10d17f24"
  }
};
