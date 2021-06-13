var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "special impose goddess danger turn guilt column raven creek dance term noble";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 6721975
      /*
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999*/
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};