import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.flightSuretyAppAddress = config.appAddress;
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    };

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    authorizeApp(callback) {
        let self = this;
        self.flightSuretyData.methods
            .authorizeCaller(self.flightSuretyAppAddress)
            .send({from: self.owner}, callback)
    }

    isAppAuthorized(callback) {
        let self = this;
        self.flightSuretyData.methods
            ._isCallerAuthorized()
            .call({from: self.flightSuretyAppAddress}, callback)
    }

    registerAirline(airline, sponsor, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: sponsor, gas: '5000000'}, callback);
    }

    isAirlineRegistered(airline, callback) {
        let self = this;
        self.flightSuretyData.methods
        .isAirlineRegistered(airline)
        .call((error, result) => {
            callback(error, result);
        })
    }

    isAirlineActivated(airline, callback) {
        let self = this;
        self.flightSuretyData.methods
        .isAirlineActivated(airline)
        .call((error, result) => {
            callback(error, result);
        })
    }

    activateAirline(airline, fee, callback) {
        let self = this;
        let feeETH = self.web3.utils.toWei(fee.toString(), 'ether');
        self.flightSuretyData.methods
            .fund()
            .send({ from: airline, value: feeETH, gas: '5000000'}, callback);
    }

    getAirlines() {
        let self = this;
        return self.airlines;
     }

    fetchFlightStatus(airline, flight, timestamp) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner});
    }

    getFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        self.flightSuretyApp.methods
        .getFlightStatus(airline, flight, timestamp)
        .call((error, result) => {
            callback(error, result);
        })
    }

    registerNewFlight(flight, airline, callback) {
        let self = this;
        let twoDays = 2*24*61*60*1000;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: Math.floor((Date.now() + twoDays) / 1000)
        }
        
        self.flightSuretyApp.methods
            .registerFlight(payload.flight, payload.timestamp)
            .send({ from: payload.airline, gas: '5000000'}, (error, result) => {
                callback(error, result, payload);
            });
    }

    buy(airline, flight, timestamp, premium, passenger,callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp,
            value: self.web3.utils.toWei(premium.toString(), 'ether')
        }
        self.flightSuretyData.methods
            .buy(payload.airline, payload.flight, payload.timestamp)
            .send({ from: passenger, value: payload.value, gas: '5000000'}, callback);
    }

    getInsuranceStatus(airline, flight, timestamp, passenger, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        }
        self.flightSuretyData.methods
            .retrievePolicyInfo(payload.airline, payload.flight, payload.timestamp, passenger)
            .call({ from: passenger}, (error, result) => {
                let premiumETH = self.web3.utils.fromWei(result.premiumPaid.toString(), 'ether');
                let balanceETH = self.web3.utils.fromWei(result.currentBalanceDue.toString(), 'ether');
                callback([premiumETH, balanceETH]);
            });
    }

    claimInsurance(airline, flight, timestamp, passenger, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        }
        self.flightSuretyData.methods
            .pay(payload.airline, payload.flight, payload.timestamp)
            .send({ from: passenger, gas: '5000000'}, callback);        
    }

    listenOracleResponse(callback) {
        let self = this;
        self.flightSuretyApp.events.FlightStatusInfo(callback);
    }
}