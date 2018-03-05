App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
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
    $(document).on('click', '.btn-TsReq', App.handleTsRequest);
  },

  getTsRequests: function() {
    var transcriptInstance;
    var transcriptInstance2;

    App.getAccountTransactions(11, 20);


    App.contracts.TranscriptReq.deployed().then(function(instance) {
      transcriptInstance = instance;

      return transcriptInstance.getReqKey.call();
    }).then(function(reqKey) {
      console.log("Request key:");
      //console.log(reqKey);
      //console.log(web3.toAscii(reqKey)); // Convert to text
      console.log(web3.toUtf8(reqKey)); // Convert to text

    }).catch(function(err) {
      console.log(err.message);
    });

    App.contracts.TranscriptReq.deployed().then(function(instance) {
      transcriptInstance2 = instance;

      return transcriptInstance2.getReqDest.call();
    }).then(function(reqDest) {
      console.log("Request Destination:");
      console.log(reqDest);

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleTsRequest: function(event) {
    event.preventDefault();
    console.log("here");

    var entered_text = $('.text-TsReq').val();

    var transcriptInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      var desti = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
      //var university = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

      App.contracts.TranscriptReq.deployed().then(function(instance) {

        transcriptInstance = instance;

        // Execute adopt as a transaction by sending account
        console.log(desti, entered_text);
        return transcriptInstance.setRequest(desti, entered_text, {from: account});
      }).then(function(result) {
        console.log("Hello!");
        console.log(result);
        return App.getTsRequests();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  getAccountTransactions: function(startBlockNumber, endBlockNumber) {
  // You can do a NULL check for the start/end blockNumber

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      web3.eth.getBlock(i, function(err, blockInfo) {
        if (!blockInfo) {
          return;
        }
        console.log(blockInfo);
        for (var j = 0; j <blockInfo.transactions.length; j++) {
          var tx = blockInfo.transactions[j];
          console.log("Transaction 1");
          console.log(tx);
          web3.eth.getTransaction(tx, function(err, txInfo) {
            console.log("Transaction 2");
            console.log(txInfo);
            console.log(web3.toAscii(txInfo.input));
          });
        }
      });
      /*
      var block = web3.eth.getBlock(function(i, true) {(i, true);
      if (block != null && block.transactions != null) {
        block.transactions.forEach( function(e) {
          if (accAddress == "*" || accAddress == e.from || accAddress == e.to) {
            console.log("  tx hash          : " + e.hash + "\n"
              + "   nonce           : " + e.nonce + "\n"
              + "   blockHash       : " + e.blockHash + "\n"
              + "   blockNumber     : " + e.blockNumber + "\n"
              + "   transactionIndex: " + e.transactionIndex + "\n"
              + "   from            : " + e.from + "\n" 
              + "   to              : " + e.to + "\n"
              + "   value           : " + e.value + "\n"
              + "   gasPrice        : " + e.gasPrice + "\n"
              + "   gas             : " + e.gas + "\n"
              + "   input           : " + e.input);
          }
        })
      }*/
    }
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
