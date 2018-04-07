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
    var data = JSON.parse(fs.readFileSync('../build/contracts/TranscriptReq.json', 'utf8'));

    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var TranscriptReqArtifact = data;
    etherApp.contracts.TranscriptReq = TruffleContract(TranscriptReqArtifact);

    // Set the provider for our contract
    etherApp.contracts.TranscriptReq.setProvider(etherApp.web3Provider);
    log("init contract complete");
  },


  getTsRequest: function(callback) {
    log("e: getTsRequest");
    var txReqInstance;

    //etherApp.getAccountTransactions(4, 10);

    //log(etherApp.contracts.TranscriptReq);

    etherApp.contracts.TranscriptReq.deployed().then(function(instance) {
      txReqInstance = instance;

      instance.getSchoolAddr.call().then(function(schoolAddr) {
        //log("e: getSchoolAddr:");
        //log(schoolAddr);

        instance.getDestinationAddr.call().then(function(destinationAddr) {
          //console.log("DBG: getDestinationAddr:");
          //console.log(destinationAddr);

          instance.getDestinationKey.call().then(function(destinationKey) {
            //console.log("DBG: getDestinationKey:");
            //console.log(web3.toUtf8(destinationKey));

            callback({
              'schoolAddr': schoolAddr,
              'destinationAddr': destinationAddr,
              'destinationKey': web3.toUtf8(destinationKey)
            });

          }).catch(function(err) {
            console.log(err.message);
            return null;
          });
        }).catch(function(err) {
          console.log(err.message);
          return null;
        });
      }).catch(function(err) {
        console.log(err.message);
        return null;
      });
    }).catch(function(err) {
      console.log(err.message);
      return null;
    });
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
                var contractAddress = txRe.contractAddress;
                etherApp.contracts.TranscriptReq.at(contractAddress).then(
                  function(instance) {
                  //console.log("got contract instance");
                  instance.isComplete().then(function(instComplete) {
                    if (instComplete === false) {
                      return callback(null, instance);
                    } else {
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
                    }
                  }).catch(function(err) {
                    return callback("err". null);
                  });
                }).catch(function(err) {
                  // Likely due to contract not being TranscriptReq
                  return callback("err". null);
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

  //var interval = setInterval(() => etherApp.getTsRequest(function(reqData) {
  etherApp.getAccountTransactions(0, function(err, reqInstance) {
    if (err || !reqInstance) {
      //console.log("gat err:" + err);
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
              // TODO encrypt transcript data with given public key
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

function handle_new_request(requestData, callback) {
  log("new request");
  // if the school address is mine, next step
  // if requestor is in the student database, get transcript data
  // encrypt transcript data with given public key
  // create response contract
  // add response to blockchain

  callback(null, "Success");
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
      ],
      'Cumulative GPA': '4.000',
      'Completed Credits': '32.000'
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
