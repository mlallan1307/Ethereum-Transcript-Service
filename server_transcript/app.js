const mongoose = require('mongoose');
const Promise = require("bluebird");
const express = require('express');
const app = express();

const crypto = require('crypto');
const Web3 = require('web3');
const fs = require("fs");
const TruffleContract = require("truffle-contract");
const aesjs = require('aes-js');

var CRYPTO_KEY_BITS  = 256;
var CRYPTO_KEY_BYTES = CRYPTO_KEY_BITS/8;
const crypt = require("node-jsencrypt");

const MY_SCHOOL_ADDRESS = "0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef";
const CONTRACT_BYTECODE = "0x606060405260043610610083576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806308a7aebb14610088578063251f73ed146100fd5780632e2751ab1461018b57806349c9c43e146101e0578063542bd0761461026e578063b2fa1c9e146102c3578063c7a22fcb146102f0575b600080fd5b341561009357600080fd5b6100e3600480803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610345565b604051808215151515815260200191505060405180910390f35b341561010857600080fd5b6101106103de565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610150578082015181840152602081019050610135565b50505050905090810190601f16801561017d5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561019657600080fd5b61019e61047c565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156101eb57600080fd5b6101f36104a1565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610233578082015181840152602081019050610218565b50505050905090810190601f1680156102605780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561027957600080fd5b61028161053f565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34156102ce57600080fd5b6102d6610565565b604051808215151515815260200191505060405180910390f35b34156102fb57600080fd5b610303610578565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156103a357600080fd5b81600490805190602001906103b992919061059e565b506001600560006101000a81548160ff02191690831515021790555060019050919050565b60048054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104745780601f1061044957610100808354040283529160200191610474565b820191906000526020600020905b81548152906001019060200180831161045757829003601f168201915b505050505081565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156105375780601f1061050c57610100808354040283529160200191610537565b820191906000526020600020905b81548152906001019060200180831161051a57829003601f168201915b505050505081565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600560009054906101000a900460ff1681565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106105df57805160ff191683800117855561060d565b8280016001018555821561060d579182015b8281111561060c5782518255916020019190600101906105f1565b5b50905061061a919061061e565b5090565b61064091905b8082111561063c576000816000905550600101610624565b5090565b905600a165627a7a72305820a8e02803acb0af5f9bf8b35a713cd703ec2c2e09979cd65ab1e3dbddbba396610029";

const priv_key = `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQDyqQZNjM9fjBbuU2n9PvlPxT1VkT1VY68HKO8DrI1YMMbDI2qh
l/PWrDt3dHnD6KBOXWvm/qTa7S3ZD7z+yV/0BOe1wsNzkXdnXUezfwlw/qJOwrjd
N3WYIiCzHG2ioaCBxXP+7Ky9rvT8ikr7cq6HlRVy8r/60mzofu6ruE78BwIDAQAB
AoGAaeoGm0CzntOpipqT73pWHVBM5hU/vQ6GbcybDnJ5Ox4HE1NZDnEhd/iy9/+5
yh22Ip46I5fP4tKVKWHqLxc8Lo+Apei7p46KBZR9vtXD5n1zR9ucOyQqiw7DANk2
7TAfH/2gUtcB4MWeGVvgy0MXJSUps3PQf9APS/VXgWCSInkCQQD8utcJyebSwcou
nkV0AvjEyFxFH+IbT/vf65I31BxAOWI4pjw3+zaZHLEzhZS6Nmi8J/4h3muHW1Wn
V7rpSdNtAkEA9czUVCv1qr807yBkdmmZzSKUF6mDSCCkM/owz+kXWAMTcY8HitSO
1MY8BIPYU40a3LJZMXbgU2iZJVRix5iwwwJAU7xMF1AwDFBs/rkt5dw+NGT2PWjs
74O2vmA82AaNPbJFmuNpPFsdoelhxOJTfsccOIs/plUdZ4GZhZKJuVXemQJACiYk
9jzCbgRrGRyLSWBe21t8JeX357iBTywba9pB/n5SBTRUqWTRaPOucrlG61w+KbKr
gCFabdc5y5LKaVdipQJAH2b2h16x2hj0iXUX1tRHp4JYnpVgr6Oo/3H6RRNsHWqb
0vrMKBfE+0IUknsuZgN13KQ8SlwPib6Op1nJqDU7kA==
-----END RSA PRIVATE KEY-----`;

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
      etherApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(etherApp.web3Provider);

    etherApp.initContract();
  },

  initContract: function() {
    var data = JSON.parse(fs.readFileSync('../ether_contracts/build/contracts/TranscriptReq.json', 'utf8'));

    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var TranscriptReqArtifact = data;
    etherApp.contracts.TranscriptReq = TruffleContract(TranscriptReqArtifact);

    // Set the provider for our contract
    etherApp.contracts.TranscriptReq.setProvider(etherApp.web3Provider);
    log("init contract complete");
  },

  getAccountTransactions: function(startingBlock, callback) {
  // You can do a NULL check for the start/end blockNumber

    web3.eth.getBlock('latest', function(err, latestBlock) {
      if (!latestBlock) {
        return callback("err". null);
      }

      for (var i = startingBlock; i <= latestBlock.number; i++) {
        web3.eth.getBlock(i, true, function(err, blockInfo) {
          if (!blockInfo) {
            return callback("err". null);
          }
          for (var j = 0; j <blockInfo.transactions.length; j++) {
            var txInfo = blockInfo.transactions[j];
            if (txInfo.to === "0x0") {
              web3.eth.getTransactionReceipt(txInfo.hash, function(err, txRe) {
                if (err) {
                  return callback(err, null);
                }
                var contractAddress = txRe.contractAddress;
                web3.eth.getCode(contractAddress, function(err, rtnCode) {
                  if (err) {
                    return callback(err, null);
                  } else if (rtnCode != CONTRACT_BYTECODE) {
                    return callback("Contract bytecode does not match", null);
                  } else {
                    etherApp.contracts.TranscriptReq.at(contractAddress).then(
                      function(instance) {
                      //console.log("got contract instance");
                      instance.isComplete().then(function(instComplete) {
                        if (instComplete === false) {
                          return callback(null, instance);
                        } /*else {
                            instance.transcript().then(function(transcriptData) {
                            log("-----------------------------");
                            log("Completed request Data:");
                            var encryptedData = web3.toUtf8(transcriptData);
                            log("Encrypted: ");
                            log(encryptedData);
                            transcript_decrypt(encryptedData, priv_key,
                              function(err, decryptedData) {
                              if (err) {
                                log("Decrypt error");
                                log(err);
                              }
                              log("Decrypted: ");
                              log(JSON.parse(decryptedData));
                              log("-----------------------------");
                            });
                            //return callback(null, instance);
                          }).catch(function(err) {
                            console.log(err);
                          });
                          
                        } */
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

  var cKey = crypto.randomBytes(CRYPTO_KEY_BYTES); // Gen AES key
  var cCounter = random_uint(); // Gen AES counter

  // 1. Convert text to bytes 
  var textBytes = aesjs.utils.utf8.toBytes(value);

  // 2. The counter mode of operation maintains internal state, so to 
  //    encrypt, a new instance must be instantiated. 
  var aesCtr = new aesjs.ModeOfOperation.ctr(cKey, new aesjs.Counter(cCounter));
  var encryptedBytes = aesCtr.encrypt(textBytes);
   
  // 3. Convert data from bytes to hex to reduce size as string
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

  return callback(null, encryptedHex, cKey, cCounter);
}

/*
function decrypt(value, cKey, cCounter, callback) {
  // 1. To decrypt the hex string, convert it back to bytes 
  var encryptedBytes = aesjs.utils.hex.toBytes(value);
   
  // 2. The counter mode of operation maintains internal state, so to 
  //    decrypt, a new instance must be instantiated. 
  var aesCtr = new aesjs.ModeOfOperation.ctr(cKey, new aesjs.Counter(cCounter));
  var decryptedBytes = aesCtr.decrypt(encryptedBytes);
   
  // 3. Convert our bytes back into text 
  var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

  return callback(null, decryptedText);
}
*/

function transcript_encrypt(transcript, pubKey, callback) {
  // Encrypt transcript data using AES, and AES key using public key

  // 1. Perform AES encryption on data
  encrypt(transcript, function(err, encryptedTs, cKey, cCounter) {
    if (err != null) {
      callback("encrypt failure");
    }

    // 2. Create data structure to hold AES key and counter
    var sym_key_data = [aesjs.utils.hex.fromBytes(cKey), cCounter];
    var sym_key_data_str = JSON.stringify(sym_key_data);

    // 3. Encrypt AES key and counter using provided public key
    var tmpCrypt = new crypt();
    tmpCrypt.setPublicKey(pubKey);
    var encryptedKey = tmpCrypt.encrypt(sym_key_data_str);

    // 4. Store combined encrypted data and encrypted keys in data structure
    var result = [encryptedTs, encryptedKey];
    return callback(null, JSON.stringify(result));
  });
}

/*
function transcript_decrypt(data, privKey, callback) {
  // Decrypt the data that was encrypted using the transcript_encrypt method

  // 1. Parse to stringified data structure that contains the encrypted data
  //    and encrypted key
  var dataParsed = JSON.parse(data);
  if (dataParsed.length != 2) {
    log("parse error: " + dataParsed);
    return callback("Error");
  }
  var encryptedData = dataParsed[0];
  var encryptedKey =  dataParsed[1];

  // 2. Using the provided private key, decrypt the encrypted AES key data
  var tmpCrypt = new crypt();
  tmpCrypt.setPrivateKey(privKey);
  var decryptedKey = tmpCrypt.decrypt(encryptedKey);
  var decryptedKeyParsed = JSON.parse(decryptedKey);
  if (decryptedKeyParsed.length != 2) {
    log("parse error: " + dataParsed);
    return callback("Error");
  }

  // 3. Return the decrypted AES key to bytes from hex
  var cKey = aesjs.utils.hex.toBytes(decryptedKeyParsed[0]);
  var cCounter = decryptedKeyParsed[1];

  // 4. Decrypt the data using the now decrypted AES key and counter
  decrypt(encryptedData, cKey, cCounter, function(err, decryptedData) {
    if (err != null) {
      callback("decrypt failure");
    }
    return callback(null, decryptedData);
  });
}
*/

/*
var PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDyqQZNjM9fjBbuU2n9PvlPxT1V
kT1VY68HKO8DrI1YMMbDI2qhl/PWrDt3dHnD6KBOXWvm/qTa7S3ZD7z+yV/0BOe1
wsNzkXdnXUezfwlw/qJOwrjdN3WYIiCzHG2ioaCBxXP+7Ky9rvT8ikr7cq6HlRVy
8r/60mzofu6ruE78BwIDAQAB
-----END PUBLIC KEY-----`;


transcript_encrypt("blah blah data", PUB_KEY, function(err, data) {
  log(err);
  log(data);
  transcript_decrypt(data, priv_key, function(err, origData) {
    log(err);
    log(origData);
  });
});
*/

function handle_requests() {

  etherApp.getAccountTransactions(0, function(err, reqInstance) {
    if (err || !reqInstance) {
      console.log("gat err:" + err);
      //console.log("gat dat:" + reqInstance);
      return;
    }

    console.log("Open contract: " + reqInstance.address);
    reqInstance.schoolAddr().then(function(schoolAddress) {
      // if the school address is mine, next step
      if (schoolAddress == MY_SCHOOL_ADDRESS) {
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
              console.log(studentRecord);
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
                      { from: MY_SCHOOL_ADDRESS,
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

  //}), 30000);

  //return interval;
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

app.get('addressCheck', function (req, res) {
});

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(4000, () => log('Example app listening on port 4000!'))

etherApp.init();
handle_requests();
