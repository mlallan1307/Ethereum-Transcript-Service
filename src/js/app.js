App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

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
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      App.getTsRequests();
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-TsReq', App.handleTsRequest);
  },

  markAdopted: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  getTsRequests: function() {
    var adoptionInstance;

    contractAddress = "0x345ca3e014aaf5dca488057592ee47305d9b3e10";
    App.getAccountTransactions(contractAddress, 25, 47);


    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getTsRequest.call();
    }).then(function(requests) {
      console.log("get Reqs");
      console.log(requests);
      console.log(web3.toUtf8(requests)); // Convert to text

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleTsRequest: function(event) {
    event.preventDefault();
    console.log("here");

    var entered_text = $('.text-TsReq').val();

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.sendTsRequest(entered_text, {from: account});
      }).then(function(result) {
        console.log("Hello!");
        return App.getTsRequests();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  getAccountTransactions: function(accAddress, startBlockNumber, endBlockNumber) {
  // You can do a NULL check for the start/end blockNumber

    console.log("Searching for transactions to/from account \"" + accAddress + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      web3.eth.getBlock(i, function(err, blockInfo) {
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
