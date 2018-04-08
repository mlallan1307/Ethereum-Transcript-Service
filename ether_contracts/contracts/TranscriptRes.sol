pragma solidity ^0.4.19;

contract TranscriptRes {
  bytes public request_txid;
  address public destination_addr;
  bytes public   response_data;

  function sendTsRes(bytes req_txid, address dest_addr, bytes data) public returns (bool) {
    request_txid = req_txid;
    destination_addr = dest_addr;
    response_data = data;

    return true;
  }

  function getRequestTxid() public view returns (bytes) {
    return request_txid;
  }

  function getDestinationAddr() public view returns (address) {
    return destination_addr;
  }

  function getData() public view returns (bytes) {
    return response_data;
  }

  function getType() public view returns (bytes) {
    return "Response";
  }

}
