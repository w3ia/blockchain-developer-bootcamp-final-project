var TenancyDeposit = artifacts.require("./TenancyDeposit.sol");

module.exports = function(deployer) {
  deployer.deploy(TenancyDeposit);
};