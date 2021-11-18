var SimpleTenancyDeposit = artifacts.require("./TenancyDeposit.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleTenancyDeposit);
};