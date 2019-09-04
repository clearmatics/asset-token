var Web3 = require("web3");
var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      provider: new HDWalletProvider("8b99e04d0a27c476c0b8f43767554752da7995f0d9775c8b9af1a225abb4aba5", "http://localhost:7545"),
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
