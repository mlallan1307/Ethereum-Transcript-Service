const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config.js');

const Web3 = require('web3');
const fs = require("fs");
const TruffleContract = require("truffle-contract");
const aesjs = require('aes-js');

const jsencrypt = require("node-jsencrypt");

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
                        if (destinationAddr == config.MY_WALLET_ADDRESS) {
                          instance.transcript().then(function(transcriptData) {
                            //log("-----------------------------");
                            //log("Completed request Data:");
                            var encryptedData = web3.toUtf8(transcriptData);
                            //log("Encrypted: ");
                            //log(encryptedData);
                            transcript_decrypt(encryptedData, config.PRIVATE_KEY,
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
  var tmpCrypt = new jsencrypt();
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
  }, 10000, new_transaction_callback);
}

function new_transaction_callback(err, info, data) {
  if (!info || !data) {
    return;
  }
  log(info);
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

server.listen(4000, () => log('Serving on port 4000!'));
//app.listen(4001, () => log('Example app listening on port 4001!'))

etherApp.init();
check_transactions();
