// migrations/2_deploy_contracts.js
const StartupFunding = artifacts.require("StartupFunding");

module.exports = function (deployer) {
  deployer.deploy(StartupFunding);
};
