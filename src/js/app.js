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
    $(document).on('click', '#sendReq', App.handleTsRequest);
  },

  getTsRequests: function() {
    var txReqInstance;

    App.getAccountTransactions(4, 5);

    return;
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

  handleTsRequest: function(event) {
    event.preventDefault();
    console.log("DBG: Handling Request");

    var val_schAddr = $('#schAddr').val();
    var val_empAddr = $('#empAddr').val();
    var val_empPubKey = $('#empPubkey').val();

    console.log('DBG: val_schAddr');
    console.log(val_schAddr);
    console.log('DBG: val_empAddr:');
    console.log(val_empAddr);
    console.log('DBG: val_empPubKey:');
    console.log(val_empPubKey);

    var txReqInstance;
    
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.log(err);
      }

      var account = accounts[0];

      // Creating contract
      App.contracts.TranscriptReq.new(val_schAddr, val_empAddr, val_empPubKey).then(function(instance) {
        console.log("Creation success");
        console.log(instance);
        instance.schoolAddr().then(function(result) {
          console.log("Result");
          console.log(result);
        });
        console.log("Creation success");
      }).catch(function(err) {
        console.log("Creation error");
        console.log(err);
        console.log("Creation error");
      });
      
    });
  },

  getAccountTransactions: function(startBlockNumber, endBlockNumber) {
  // You can do a NULL check for the start/end blockNumber

    web3.eth.getBlock('latest', function(err, latestBlock) {
      if (!latestBlock) {
        return;
      }

      for (var i = 0; i <= latestBlock.number; i++) {
        web3.eth.getBlock(i, true, function(err, blockInfo) {
          if (!blockInfo) {
            return;
          }
          //console.log(blockInfo);
          for (var j = 0; j <blockInfo.transactions.length; j++) {
            var txInfo = blockInfo.transactions[j];
            console.log(txInfo);
            if (txInfo.to === "0x0") {
              web3.eth.getTransactionReceipt(txInfo.hash, function(err, txRe) {
                console.log("Transaction");
                console.log(txRe);
                var contractAddress = txRe.contractAddress;
                App.contracts.TranscriptReq.at(contractAddress).then(function(instance) {
                  console.log("got instance");
                  console.log(instance);
                }).catch(function(err) {
                  console.log("get instance error");
                  console.log(err);
                });
              });
            }
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
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
