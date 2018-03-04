var Adoption = artifacts.require("Adoption");
var Transcript = artifacts.require("Transcript");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(Transcript);
};
