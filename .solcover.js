//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { scripts } = require("zos");
const { push, session, add } = scripts;
const { ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const { exec } = require('child_process');
var Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545')); //config object may be used to set dynamically

ZWeb3.initialize(web3.currentProvider);

// triggered after ganache server is setup and before tests start
// need to deploy zos dependencies 
async function serverReadyHandler(config){
  accounts = await web3.eth.getAccounts()

  add({
    contractsData: [{ name: "AssetToken", alias: "AssetToken" }]
  });

  res = await session({network:"development", from:accounts[0]})
  console.log(res)
  
  await push({network:"development", deployDependencies:true})
  console.log("here")
}

module.exports = {
  onServerReady: serverReadyHandler
};
