import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
//web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

// Flight status codes
let statusCodes = [0, 10, 20, 30, 40, 50];

// Transaction parameters
let registrationFee = web3.utils.toWei('1', 'ether');
let transactionGas = '2000000';

// Retrieving oracle accounts and storing them in variable oracleAccounts
let oracleAccounts = [];
let totalOracles = 20;
let oracleInitialIndex = 10;

web3.eth.getAccounts((error, accounts) => {
  for(let i = 0; i < totalOracles; i++) {
    oracleAccounts[i] = accounts[oracleInitialIndex + i];
    flightSuretyApp.methods.
    registerOracle()
    .send({
      from: oracleAccounts[i],
      value: registrationFee,
      gas: transactionGas},
      (error, result) => {
        if(error) {
          console.log(error);
        }
        else {
          console.log(result);
          flightSuretyApp.methods.
            getMyIndexes()
            .call({from: oracleAccounts[i]}, (error, result) => {
              console.log(`Oracle ${oracleAccounts[i]} has index ${result}`);
            })
        }
              
            });
    console.log(oracleAccounts[i]);
  }
});




flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {console.log(error)}
    if(event) {
      console.log(event);
      let eventResult = event.returnValues;
      for(let oracle of oracleAccounts){
        flightSuretyApp.methods.
        getMyIndexes()
        .call({from: oracle}, (error, indexes) => {
            // Check if the oracle fullfills the index condition
            if(eventResult.index == indexes[0] || eventResult.index == indexes[1] || eventResult.index == indexes[2]) {
              // The status code response is randomized for each oracle
              let randomIndex = Math.floor((Math.random() * 5) + 1);
              let status = statusCodes[randomIndex];              
              flightSuretyApp.methods.
              submitOracleResponse(
                eventResult.index,
                eventResult.airline,
                eventResult.flight,
                eventResult.timestamp,
                status)
              .send({
                from: oracle,
                gas: transactionGas},
                (error, result) => {
                  if(error) {
                    console.log(error);
                  }
                  console.log(`Response ${status} from oracle (${indexes}) ${oracle}`);
                })
            }
        });
      }      
    }    
})

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: 0
}, function (error, event) {
    console.log(event);    
});
;

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


