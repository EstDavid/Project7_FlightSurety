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

// Test parameters
let randomnessOverride = false; // If true, the oracles will submit a specific status code
let statusCodeOverride = 20; // If override is true, oracles will submit this code

// Retrieving oracle accounts and storing them in variable oracleAccounts
let oracleAccounts = [];
let oracleIndexes = {};
let totalOracles = 20;
let oracleInitialIndex = 10;

web3.eth.getAccounts((error, accounts) => {
  for(let i = 0; i < totalOracles; i++) {
    let oracleAddress;
    oracleAddress = accounts[oracleInitialIndex + i];
    oracleAccounts.push(oracleAddress);
    flightSuretyApp.methods.
    registerOracle()
    .send({
      from: oracleAddress,
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
            .call({from: oracleAddress}, (error, result) => {
              console.log(result);
              console.log(`Oracle ${oracleAddress} has index ${result}`);
              oracleIndexes[oracleAddress] = result;
            })
        }
              
            });
  }
});

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {console.log(error)}
    if (event) {
      console.log(event);
      let eventResult = event.returnValues;
      for(let oracle of oracleAccounts){
        let indexes = oracleIndexes[oracle];
        if(indexes) {
          if(
            eventResult.index == parseInt(indexes[0]) ||
            eventResult.index == parseInt(indexes[1]) || 
            eventResult.index == parseInt(indexes[2])) {
            // The status code response is randomized for each oracle
            let randomIndex;
            let status;
            if (randomnessOverride) {
              // If there is a randomness override, this is the code assigned
              status = statusCodeOverride;
            } else {
              // If there is no randomness override, the code assigned is random
              randomIndex = Math.floor(Math.random() * 6);
              status = statusCodes[randomIndex];
            }
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
              });
          }
        }
      }      
    }    
});

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


