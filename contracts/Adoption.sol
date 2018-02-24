pragma solidity ^0.4.19;

contract Adoption {
  address[16] public adopters;
  bytes32 public myMessage = "hello";

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

  function getMyMessage() public view returns (bytes32) {
    return myMessage;
  }
}
