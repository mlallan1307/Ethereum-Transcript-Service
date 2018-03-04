pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TranscriptReq.sol";

contract TestTranscript {
  TranscriptReq transcriptReq = TranscriptReq(DeployedAddresses.TranscriptReq());

  // Testing retrieval of all pet owners
  function testTsRequest() public {
    bytes storage key_test = bytes(0);

    transcriptReq.sendTsRequest(key_test);

    bytes storage rtnMsg = transcriptReq.getTsRequest();

    Assert.equal(rtnMsg, key_test, "Test message failed");
  }

}
