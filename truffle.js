var Web3 = require('web3')

module.exports = {
  networks: {
    ci: {
      host: "daragao-testrpc",
      port: 8545,
      network_id: "*" // Match any network id
    },
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    stage01: {
      host: "34.253.101.161",
      port: 8545,
      network_id: "*",
      gas: 4712300,
      from: "0x8a7cf916f9b6e1bb55ea6282eb5c8b5eb5b999cc"
    },
    dev01: {
      host: "https://node1.dev01.clearmatics.com",
      port: 443,
      network_id: "*",
      gas: 2000000,
      from: "0x8a7cf916f9b6e1bb55ea6282eb5c8b5eb5b999cc",
      provider: new Web3.providers.HttpProvider('https://node1.dev01.clearmatics.com:443')
    }
  }
};
