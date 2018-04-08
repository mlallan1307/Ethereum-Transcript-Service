const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const crypto = require('crypto');
const Web3 = require('web3');
const fs = require("fs");
const TruffleContract = require("truffle-contract");
const aesjs = require('aes-js');

const crypt = require("node-jsencrypt");

const MY_WALLET_ADDRESS = "0xf17f52151ebef6c7334fad080c5704d77216b732";

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
                      return callback(null, null);
                    } else {
                      instance.destinationAddr().then(function(destinationAddr) {
                        if (destinationAddr == MY_WALLET_ADDRESS) {
                          instance.transcript().then(function(transcriptData) {
                            //log("-----------------------------");
                            //log("Completed request Data:");
                            var encryptedData = web3.toUtf8(transcriptData);
                            //log("Encrypted: ");
                            //log(encryptedData);
                            transcript_decrypt(encryptedData, priv_key,
                              function(err, decryptedData) {
                              if (err) {
                                //log("Decrypt error");
                                //log(err);
                              }
                              //log("Decrypted: ");
                              //log(JSON.parse(decryptedData));
                              //log("-----------------------------");
                              var contractData = {
                                'block': blockInfo.number,
                                'contractAddress': contractAddress
                              }
                              return callback(err, contractData, JSON.parse(decryptedData));
                            });
                          }).catch(function(err) {
                            return callback("err". null);
                          });
                        }
                      }).catch(function(err) {
                        return callback("err". null);
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

function log(msg) {
  console.log(msg);
}

io.on('connection', function(client) {
  log('client connected');
  client.emit("transcripts", transcriptDataRead);
});

var latestBlock = 0;
var transcriptDataRead = {};

function check_transactions() {
  setInterval(function(newTxCb) {
    etherApp.getAccountTransactions(latestBlock, newTxCb);
  }, 5000, new_transaction_callback);
}

function new_transaction_callback(err, info, data) {
  log("check tx");
  if (!info || !data) {
    return;
  }
  log(err);
  log(info);
  log(data);
  if (latestBlock <= info.block) {
    latestBlock = info.block + 1;
  }
  if (data) {
    transcriptDataRead[info.contractAddress] = data;
    io.emit("transcripts", transcriptDataRead);
  }
}

const path = require('path');
app.use(express.static(path.join(__dirname, '/employer-client/dist')));

server.listen(4001, () => log('Example server listening on port 4001!'));
//app.listen(4001, () => log('Example app listening on port 4001!'))

etherApp.init();
check_transactions();
