const GLDToken = artifacts.require("GLDToken");
const SILToken = artifacts.require("SILToken");
const BRZToken = artifacts.require("BRZToken");
const SwaparooCore = artifacts.require("SwaparooCore");

module.exports = function (deployer) {
    deployer.deploy(SwaparooCore);
    deployer.deploy(GLDToken, web3.utils.toBN('10000000000000000000'));
    deployer.deploy(SILToken, web3.utils.toBN('10000000000000000000'));
    deployer.deploy(BRZToken, web3.utils.toBN('10000000000000000000'));
}as Truffle.Migration;

export {};