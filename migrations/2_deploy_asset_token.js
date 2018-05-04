const AssetToken = artifacts.require(`./AssetToken.sol`)
const MockReceivingContract = artifacts.require(`./MockReceivingContract.sol`)

module.exports = (deployer) => {
  deployer.deploy(AssetToken, "CLR", "Asset Token");
  deployer.deploy(MockReceivingContract);
}
