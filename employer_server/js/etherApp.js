etherApp = {
  fs = require("fs");
  web3Provider: null,
  contracts: {},

  init: function(web3Lib) {
    return App.initWeb3(web3Lib);
  },

  initWeb3: function(web3Lib) {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new web3Lib.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new web3Lib(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    var data = require('../build/contracts/TranscriptReq.json');
    console.log(data);
    $.getJSON('TranscriptReq.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var TranscriptReqArtifact = data;
      App.contracts.TranscriptReq = TruffleContract(TranscriptReqArtifact);

      // Set the provider for our contract
      App.contracts.TranscriptReq.setProvider(App.web3Provider);

      return App.getTsRequests();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
  },

  getTsRequests: function() {
    var txReqInstance;

    App.getAccountTransactions(4, 10);

    App.contracts.TranscriptReq.deployed().then(function(instance) {
      txReqInstance = instance;

      return txReqInstance.getSchoolAddr.call();
    }).then(function(result) {
      console.log("DBG: getSchoolAddr:");
      //console.log(reqKey);
      //console.log(web3.toAscii(reqKey)); // Convert to text
      console.log(result); // Convert to text

    }).catch(function(err) {
      console.log(err.message);
    });


    var txReqInstance2;
    App.contracts.TranscriptReq.deployed().then(function(instance) {
      txReqInstance2 = instance;

      return txReqInstance2.getDestinationAddr.call();
    }).then(function(result) {
      console.log("DBG: getDestinationAddr:");
      console.log(result);

    }).catch(function(err) {
      console.log(err.message);
    });


    var txReqInstance3;
    App.contracts.TranscriptReq.deployed().then(function(instance) {
      txReqInstance3 = instance;

      return txReqInstance3.getDestinationKey.call();
    }).then(function(result) {
      console.log("DBG: getDestinationKey:");
      console.log(web3.toUtf8(result));

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getAccountTransactions: function(startBlockNumber, endBlockNumber) {
    // You can do a NULL check for the start/end blockNumber

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
        return;
      }

      var account = accounts[0];

      for (var i = startBlockNumber; i <= endBlockNumber; i++) {
        web3.eth.getBlock(i, function(err, blockInfo) {
          if (!blockInfo) {
            return;
          }
          //console.log(blockInfo);
          for (var j = 0; j <blockInfo.transactions.length; j++) {
            var tx = blockInfo.transactions[j];
            web3.eth.getTransaction(tx, function(err, txInfo) {
              if (txInfo.from === account &&
                  txInfo.to === "0xf25186b5081ff5ce73482ad761db0eb0d25abfbf") {
                console.log("Transaction");
                console.log(txInfo);
                console.log(web3.toAscii(txInfo.input));
              }
            });
          }
        });
      }
    });
  }

};

