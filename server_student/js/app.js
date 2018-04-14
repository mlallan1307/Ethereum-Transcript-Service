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
      web3.eth.getAccounts(function(err, accounts) {
        if (err) {
          console.log(err);
          return;
        }

        var account = accounts[0];
        App.contracts.TranscriptReq.defaults({from: account});
        return;
      });

    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#sendReq', App.handleTsRequest);
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

    if (val_empPubKey.length < 799) {
      console.log("Public key is too short! " + val_empPubKey.length);
      return;
    }

    var txReqInstance;
    
    // Creating contract
    var newContractPromise = App.contracts.TranscriptReq.new(
        val_schAddr,
        val_empAddr,
        val_empPubKey);

    newContractPromise.then(function(instance) {
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
  }

};

$(function() {
  App.init();
});
