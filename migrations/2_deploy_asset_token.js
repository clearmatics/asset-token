const { scripts, ConfigVariablesInitializer } = require("zos");
const { add, push, create } = scripts;

require("openzeppelin-test-helpers/configure")({ web3 });

//const ERC777Sender = artifacts.require(`./ERC777TokensSender.sol`);
const MockRecipientContract = artifacts.require(`./MockRecipientContract.sol`);
const MockSenderContract = artifacts.require(`./MockSenderContract.sol`);

async function deploy(options, tokenOwner) {
  //Register Contract in the zos project
  add({
    contractsData: [{ name: "AssetToken", alias: "AssetToken" }]
  });

  //push it to the network
  await push(options);

  //create an upgradable instance of it (proxy) and initialize the logic
  await create(
    Object.assign(
      {
        contractAlias: "AssetToken",
        methodName: "initialize",
        methodArgs: ["CLR", "Asset Token", tokenOwner, []]
      },
      options
    )
  );
}

module.exports = (deployer, networkName, accounts) => {
  deployer.then(async () => {
    deployer.deploy(MockRecipientContract);
    deployer.deploy(MockSenderContract);
    const {
      network,
      txParams
    } = await ConfigVariablesInitializer.initNetworkConfiguration({
      network: networkName,
      from: accounts[1]
    });
    await deploy({ network, txParams }, accounts[2]);
  });
};
