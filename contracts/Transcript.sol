pragma solidity ^0.4.19;

contract Transcript {
  bytes32 public requestors_key;

  function sendTsRequest(bytes32 req_key) public returns (bool) {
    requestors_key = req_key;

    return true;
  }

  function getTsRequest() public view returns (bytes32) {
    return requestors_key;
  }

}
