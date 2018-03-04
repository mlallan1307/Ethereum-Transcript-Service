var Adoption = artifacts.require("Adoption");
var TranscriptReq = artifacts.require("TranscriptReq");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(TranscriptReq);
};
