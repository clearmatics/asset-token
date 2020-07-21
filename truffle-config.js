var Web3 = require("web3");
var PrivateKeyProvider = require("truffle-privatekey-provider");

module.exports = {
  networks: {
    autonity: {
      skipDryRun: true,
      provider: () => new PrivateKeyProvider("private_key_shuld_be_here", "http://127.0.0.1:8545"),
      network_id: "*",
      gasPrice: 10000000000000
    },

    development: {
      host: "localhost",
      port: 7545,
      network_id: "*"
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
