const MockReceivingContract = artifacts.require(`./MockReceivingContract.sol`);
const NotAReceivingContract = artifacts.require(`./NotAReceivingContract.sol`);
const UpgradeableAssetToken = artifacts.require("./UpgradeableAssetToken.sol");

module.exports = (deployer, accounts) => {
  deployer.deploy(MockReceivingContract);
  deployer.deploy(NotAReceivingContract);
  deployer.deploy(UpgradeableAssetToken, "CLR", "Asset Token", accounts[0]);
};
