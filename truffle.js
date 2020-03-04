var Web3 = require("web3");

module.exports = {
  networks: {
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
