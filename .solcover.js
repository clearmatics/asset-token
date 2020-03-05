//Copyright (c) 2019 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const { ZWeb3 } = require("zos-lib"); //to retrieve compiled contract artifacts
const util = require('util');
const exec = util.promisify(require('child_process').exec);

var Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8555')); //config object may be used to set dynamically

ZWeb3.initialize(web3.currentProvider);

// triggered after ganache server is setup and before tests start
// need to deploy zos dependencies 
async function serverReadyHandler(config){

  await exec("npx zos session --network soliditycoverage")
  
  console.log("Deploying dependencies..");
  
  await exec("npx zos push --deploy-dependencies --network soliditycoverage") 

}

module.exports = {
  onServerReady: serverReadyHandler
};
