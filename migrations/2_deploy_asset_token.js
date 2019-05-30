const { scripts, ConfigVariablesInitializer } = require("zos");
const { add, push, create } = scripts;
const MockReceivingContract = artifacts.require(`./MockReceivingContract.sol`);
const NotAReceivingContract = artifacts.require(`./NotAReceivingContract.sol`);

async function deploy(options, tokenOwner) {
  //Register Contract in the zos project
  add({
    contractsData: [{ name: "UpgradeableAssetToken", alias: "AssetToken" }]
  });

  //push it to the network
  await push(options);

  //create an upgradable instance of it (proxy) and initialize the logic
  await create(
    Object.assign(
      {
        contractAlias: "AssetToken",
        methodName: "initialize",
        methodArgs: ["CLR", "Asset Token", tokenOwner]
      },
      options
    )
  );
}

module.exports = (deployer, networkName, accounts) => {
  deployer.then(async () => {
    deployer.deploy(MockReceivingContract);
    deployer.deploy(NotAReceivingContract);
    //deployer.deploy(UpgradeableAssetToken, "CLR", "Asset Token", accounts[0]);
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
