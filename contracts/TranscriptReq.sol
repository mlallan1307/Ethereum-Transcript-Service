pragma solidity ^0.4.19;

contract TranscriptReq {
  address public studentAddr;
  address public schoolAddr;
  address public destinationAddr;
  bytes public   destinationKey;
  bytes public   transcript;
  bool public    isComplete;

  // Contructor
  function TranscriptReq(address sch_addr, address dest_addr, bytes dest_key) public {
    require(sch_addr != address(0));
    require(dest_addr != address(0));
    require(dest_key.length > 0);

    studentAddr = msg.sender;
    schoolAddr = sch_addr;
    destinationAddr = dest_addr;
    destinationKey = dest_key;
    transcript = "";
    isComplete = false;
  }

  // Only the school is able to set the transcript data
  // returns true if transcript data was set, false otherwise
  function setTranscript(bytes transcript_data) public returns (bool) {
    require(msg.sender == schoolAddr);

    transcript = transcript_data;
    isComplete = true;
    return true;
  }

}
