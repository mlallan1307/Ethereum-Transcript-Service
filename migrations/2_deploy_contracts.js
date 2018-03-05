var Adoption = artifacts.require("Adoption");
var TranscriptReq = artifacts.require("TranscriptReq");
var TranscriptRes = artifacts.require("TranscriptRes");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(TranscriptReq);
  deployer.deploy(TranscriptRes);
};
