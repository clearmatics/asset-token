const AssetToken = artifacts.require(`./AssetToken.sol`)

module.exports = (deployer) => {
  deployer.deploy(AssetToken, "CLR", "Asset Token");
}
