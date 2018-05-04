const AssetToken = artifacts.require(`./AssetToken.sol`)
const MockReceivingContract = artifacts.require(`./MockReceivingContract.sol`)
const NotAReceivingContract = artifacts.require(`./NotAReceivingContract.sol`)

module.exports = (deployer) => {
  deployer.deploy(AssetToken, "CLR", "Asset Token");
  deployer.deploy(MockReceivingContract);
  deployer.deploy(NotAReceivingContract);
}
