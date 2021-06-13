
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x3DF3AB7C3fF3C5e9a40731C155446245653dCa33",
        "0xd84312CE4C4b9eD387A6941f6495778dd0E0bA44",
        "0xEA11C97F59573B5538FCD777C9876A54d50E344b",
        "0xfbaC81Bda65519C3e15d6E5B8739bf85496256F7",
        "0xb957F3F21362293d5842227F32D775896C6dc395",
        "0xf14aEe58e43E529c9a1345b3448541eeF670FAd7",
        "0x452bbe1cE37D1643E719d84eCD60A6FD0705d886",
        "0x0Dd81B108bb50d59fb5885336e83125cAd91d9Df",
        "0xdd2eFF08e0b49bb2ecf008046c62F1a912fa5F1D",
        "0xb85a113A6715d922d4319a7FE10F5A36C1324221"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};