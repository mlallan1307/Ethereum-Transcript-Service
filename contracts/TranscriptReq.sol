pragma solidity ^0.4.19;

contract TranscriptReq {
  bytes public requestors_key;
  address public destination_addr;

  function setRequest(address dest_addr, bytes req_key) public returns (bool) {
    requestors_key = req_key;
    destination_addr = dest_addr;

    return true;
  }

  function getReqKey() public view returns (bytes) {
    return requestors_key;
  }

  function getReqDest() public view returns (address) {
    return destination_addr;
  }


}
