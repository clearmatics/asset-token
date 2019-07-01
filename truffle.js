var Web3 = require("web3");

module.exports = {
  networks: {
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
