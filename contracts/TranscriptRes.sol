pragma solidity ^0.4.19;

contract TranscriptRes {
  bytes public response_data;

  function sendTsRes(bytes data) public returns (bool) {
    response_data = data;

    return true;
  }

  function getTsRes() public view returns (bytes) {
    return response_data;
  }

}
