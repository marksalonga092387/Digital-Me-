const Applicants = artifacts.require("./Applicants.sol");

module.exports = function(deployer) {
  deployer.deploy(Applicants);
};
