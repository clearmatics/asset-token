var Web3 = require("web3");
var PrivateKeyProvider = require("truffle-privatekey-provider");
const { getArgument } = require('./utils_deployment')
const network = getArgument("--network") || undefined
let nodeURL = getArgument("--nodeURL") || undefined
let PK = getArgument("--privateKey") || undefined

module.exports = {
  networks: {

    //this is for platformx2 
    autonity: {
      skipDryRun: true,
      provider: () => new PrivateKeyProvider(PK, nodeURL),
      network_id: "*", // Match any network id, 
      gasPrice: 10000000000000
    },
    rinkeby: {
      skipDryRun: true,
      network_id: "*", // Match any network id, 
      provider: () => new PrivateKeyProvider(PK, nodeURL),
    },

    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    },
    soliditycoverage: {
      host: "localhost",
      port: 8555,
      network_id: "*" // Match any network id
    }
  },

  solc: {
    optimizer: {
      enabled: false, // test coverage won't work otherwise
      runs: 200
    },
    version: "0.5.3+commit.10d17f24"
  },
  plugins: ["solidity-coverage"]
};
