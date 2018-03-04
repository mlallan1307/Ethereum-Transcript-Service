pragma solidity ^0.4.19;

contract TranscriptReq {
  bytes public requestors_key;

  function sendTsRequest(bytes req_key) public returns (bool) {
    requestors_key = req_key;

    return true;
  }

  function getTsRequest() public view returns (bytes) {
    return requestors_key;
  }

}
