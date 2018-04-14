const mongoose = require('mongoose');
const Promise = require("bluebird");
const express = require('express');
const app = express();
const config = require('./config.js');

const crypto = require('crypto');
const Web3 = require('web3');
const fs = require("fs");
const TruffleContract = require("truffle-contract");
const aesjs = require('aes-js');

const AES_KEY_BYTES = config.AES_KEY_BITS/8;
const jsencrypt = require("node-jsencrypt");


LATEST_BLOCK = 0;

etherApp = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return etherApp.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      etherApp.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      etherApp.web3Provider = new Web3.providers.HttpProvider(config.WEB3_PROVIDER);
    }
    web3 = new Web3(etherApp.web3Provider);

    etherApp.initContract();
  },

  initContract: function() {
    var data = JSON.parse(fs.readFileSync(config.CONTRACT_FILE, 'utf8'));

    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var TranscriptReqArtifact = data;
    etherApp.contracts.TranscriptReq = TruffleContract(TranscriptReqArtifact);

    // Set the provider for our contract
    etherApp.contracts.TranscriptReq.setProvider(etherApp.web3Provider);
    log("init contract complete");
  },

  getIncompleteContracts: function(callback) {
    web3.eth.getBlock('latest', function(err, latestBlock) {
      if (!latestBlock) {
        return callback("err". null);
      }

      starting_block = LATEST_BLOCK;
      LATEST_BLOCK = latestBlock.number + 1;

      // check from starting block to latest block
      for (var i = starting_block; i <= latestBlock.number; i++) {
        // get block info
        web3.eth.getBlock(i, true, function(err, blockInfo) {
          if (!blockInfo) {
            return callback("err". null);
          }
          // get transaction info
          for (var j = 0; j <blockInfo.transactions.length; j++) {
            var txInfo = blockInfo.transactions[j];
            // to of 0x0 means this is a contract creation
            if (txInfo.to === "0x0") {
              // get transaction receipt info
              web3.eth.getTransactionReceipt(txInfo.hash, function(err, txRe) {
                if (err) {
                  return callback(err, null);
                }
                var contractAddress = txRe.contractAddress;
                // get the bytebode at the contact address
                web3.eth.getCode(contractAddress, function(err, rtnCode) {
                  if (err) {
                    return callback(err, null);
                  } else if (rtnCode != config.CONTRACT_BYTECODE) {
                    return callback("Contract bytecode does not match", null);
                  } else {
                    // Valid contract found, get instance
                    etherApp.contracts.TranscriptReq.at(contractAddress).then(
                      function(instance) {
                      // check if the contract is complete or not
                      instance.isComplete().then(function(instComplete) {
                        if (instComplete === false) {
                          // Handle incomplete contract
                          return callback(null, instance);
                        }
                      }).catch(function(err) {
                        return callback("err". null);
                      });
                    }).catch(function(err) {
                      // Likely due to contract not being TranscriptReq
                      return callback("err". null);
                    });
                  }
                });
              });
            }
          }
        });
      }
    });
  }

};

function random_uint(){
  var maxBytes = Math.log2(Number.MAX_SAFE_INTEGER); // Get max number of bits
  maxBytes = (maxBytes/8); // Convert to bytes but may be float number
  maxBytes = Math.floor(maxBytes); // Round down to nearest byte
  var buf = crypto.randomBytes(maxBytes);
  var uint = buf.readUIntBE(0, buf.length);
  return uint;
}

function encrypt(value, callback) {
  // AES Encryption using counter mode

  var cKey = crypto.randomBytes(AES_KEY_BYTES); // Gen AES key
  var cCounter = random_uint(); // Gen AES counter

  // 1. Convert text to bytes 
  var textBytes = aesjs.utils.utf8.toBytes(value);

  // 2. The counter mode of operation maintains internal state, so to 
  //    encrypt, a new instance must be instantiated. 
  var aesCtr = new aesjs.ModeOfOperation.ctr(cKey, new aesjs.Counter(cCounter));
  var encryptedBytes = aesCtr.encrypt(textBytes);
   
  // 3. Convert data from bytes to hex to reduce size as string
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  if (!encryptedHex || !cKey || !cCounter) {
    return callback("AES Error");
  }

  return callback(null, encryptedHex, cKey, cCounter);
}

function transcript_encrypt(transcript, pubKey, callback) {
  // Encrypt transcript data using AES, and AES key using public key

  if (pubKey.length < config.MIN_PUBLIC_KEY_BYTES) {
    return callback("RSA key is too short! Keys must be over 4096 bits, " + pubKey.length);
  }

  // 1. Perform AES encryption on data
  encrypt(transcript, function(err, encryptedTs, cKey, cCounter) {
    if (err != null) {
      return callback("AES encrypt failure");
    }

    // 2. Create data structure to hold AES key and counter
    var sym_key_data = [aesjs.utils.hex.fromBytes(cKey), cCounter];
    var sym_key_data_str = JSON.stringify(sym_key_data);

    // 3. Encrypt AES key and counter using provided public key
    var tmpCrypt = new jsencrypt();
    tmpCrypt.setPublicKey(pubKey);
    var encryptedKey = tmpCrypt.encrypt(sym_key_data_str);
    if (!encryptedKey) {
      return callback("RSA encrypt failure");
    }

    // 4. Store combined encrypted data and encrypted keys in data structure
    var result = [encryptedTs, encryptedKey];
    return callback(null, JSON.stringify(result));
  });
}


function handle_requests() {

  return setInterval(function () {
    etherApp.getIncompleteContracts(function(err, reqInstance) {
      if (err || !reqInstance) {
        console.log("getIncompleteContracts err: " + err);
        //console.log("gat dat:" + reqInstance);
        return;
      }

      console.log("Open contract: " + reqInstance.address);
      reqInstance.schoolAddr().then(function(schoolAddress) {
        // if the school address is mine, next step
        if (schoolAddress == config.MY_SCHOOL_ADDRESS) {
          console.log("School Addr: " + schoolAddress);
          // get student address from request
          reqInstance.studentAddr().then(function(studentAddress) {
            console.log(studentAddress);
            if (!studentAddress) {return}
            // if requestor is in the student database, get transcript data
            db_student.findOne({ address: studentAddress },
              function (err, studentRecord) {
              if (err) {
                console.log("db err: " + err);
                console.log(err);
              } else if (studentRecord) {
                console.log("found student");
                //console.log(studentRecord);
                reqInstance.destinationKey().then(function(destinationKey) {
                  if (!destinationKey) {return}
                  var pubKey = web3.toUtf8(destinationKey);
                  transcript_encrypt(studentRecord.transcript, pubKey,
                    function(err, encryptedTs) {
                    if (err) {
                      log("transcript_encrypt error");
                      log(err);
                      return;
                    }
                    // create response contract
                    reqInstance.setTranscript(
                        encryptedTs,
                        { from: config.MY_SCHOOL_ADDRESS,
                          gas: 5000000,
                          gasPrice: 1000000000 }).then(function(result) {
                      console.log("Success!");
                      console.log(result);
                    }).catch(function(err) {
                      console.log("TX response err:");
                      console.log(err);
                    });
                  });
                }).catch(function(err) {
                  console.log(err);
                });
              }
            });
          }).catch(function(err) {
            console.log(err);
          });
        }
      }).catch(function(err) {
        console.log(err);
      });
    });

  }, 10000);
}

function log(msg) {
  console.log(msg);
}

var uri = 'mongodb://localhost:27017/transcripts';
var db_options = { promiseLibrary: Promise };
var db = mongoose.createConnection(uri, db_options);

db_student = db.model('students',
  new mongoose.Schema({
    name: String,
    address: String,
    transcript: String
  })
);

db_latestReq = db.model('latestReq',
  new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed
  })
);

db.on('open', function() {
  log("Mongodb is ready!");
  init_db();
});

function init_db() {
  var student_jack = new db_student({
    name: "Jack Allan",
    address: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
    transcript: JSON.stringify({
      'Name': "Jack Allan",
      'Cumulative GPA': '4.000',
      'Completed Credits': '32.000',
      'courses': [
        {
          'Term':       'FA 2014',
          'Course':     'CS-440-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'SP 2015',
          'Course':     'CS-540-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'SU 2015',
          'Course':     'CS-430-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'FA 2015',
          'Course':     'CS-457-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'SP 2016',
          'Course':     'CS-557-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'FA 2016',
          'Course':     'CS-545-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'SP 2017',
          'Course':     'CS-530-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        },{
          'Term':       'FA 2017',
          'Course':     'CS-414-801',
          'GPA Hours':  '4.000',
          'GPA Earned': '4.000'
        }
      ]
    })
  });

  db_student.findOne({ name: student_jack.name }, function (err, res) {
    if (res === null) {
      log("DBG: Creating student " + student_jack.name);
      student_jack.save(function (err) {
        if (err) {
          log("DBG: Failed to save")
        }
      });
    }
  });
}

etherApp.init();
INTERVAL_HANDLE = handle_requests();
