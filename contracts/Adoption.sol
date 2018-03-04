pragma solidity ^0.4.19;

contract Adoption {
  bytes32 public requestors_key;
  address[16] public adopters;

  // Adopting a pet
  function adopt(uint petId) public returns (uint) {
    require(petId >= 0 && petId <= 15);

    adopters[petId] = msg.sender;

    return petId;
  }

  // Retrieving the adopters
  function getAdopters() public view returns (address[16]) {
    return adopters;
  }

  function sendTsRequest(bytes32 req_key) public returns (bool) {
    requestors_key = req_key;

    return true;
  }

  function getTsRequest() public view returns (bytes32) {
    return requestors_key;
  }

}
