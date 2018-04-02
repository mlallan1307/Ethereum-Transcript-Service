const mongoose = require('mongoose');
const express = require('express');
const app = express();

const Web3 = require('web3');
const fs = require("fs");
const TruffleContract = require("truffle-contract");

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
    log("e: initContract");
    var data = JSON.parse(fs.readFileSync('../build/contracts/TranscriptReq.json', 'utf8'));

    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var TranscriptReqArtifact = data;
    etherApp.contracts.TranscriptReq = TruffleContract(TranscriptReqArtifact);

    // Set the provider for our contract
    etherApp.contracts.TranscriptReq.setProvider(etherApp.web3Provider);
    log("init complete");
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
                etherApp.contracts.TranscriptReq.at(contractAddress).then(function(instance) {
                  //console.log("got contract instance");
                  instance.isComplete().then(function(instComplete) {
                    if (instComplete === false) {
                      return callback(null, instance);
                    } else {
                      instance.transcript().then(function(transcriptData) {
                        log("-----------------------------");
                        log("Completed request Data:");
                        var data = web3.toUtf8(transcriptData);
                        log("Encrypted: ");
                        log(data);
                        var tmpCrypt = new crypt();
                        tmpCrypt.setPrivateKey(priv_key);
                        var decrypted = tmpCrypt.decrypt(data);
                        log("Decrypted: ");
                        log(decrypted);
                        log("-----------------------------");

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
          db_student.findOne({ address: studentAddress }, function (err, studentRecord) {
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
                log(pubKey);
                var tmpCrypt = new crypt();
                tmpCrypt.setPublicKey(pubKey);
                var encryptedTs = tmpCrypt.encrypt(studentRecord.transcript);
                log(encryptedTs);
                // create response contract
                reqInstance.setTranscript(
                    studentRecord.transcript,
                    { from: MY_SCHOOL_ADDRESS,
                      gas: 5000000,
                      gasPrice: 1000000000 }).then(function(result) {
                  console.log("Success!");
                  console.log(result);
                  
                }).catch(function(err) {
                  console.log("TX response err:");
                  console.log(err);
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
// Use bluebird
var db_options = { promiseLibrary: require('bluebird') };
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
