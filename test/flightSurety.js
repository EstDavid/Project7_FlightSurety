
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var BN = web3.utils.BN;

contract('Flight Surety Tests', async (accounts) => {
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const fourthAirline = accounts[4];
    const fifthAirline = accounts[5];
    const passenger = accounts[6];
    const activationFee = web3.utils.toWei('10', "ether");

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(secondAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(secondAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can register an Airline using registerAirline() once it is funded', async () => {
    
    // ARRANGE

    // ACT
    // The first airline activates its account by paying 10 eth
    try {
        await config.flightSuretyData.fund({from: config.firstAirline, value: activationFee});
    }
    catch(e) {
    }

    try {
        await config.flightSuretyApp.registerAirline(secondAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(secondAirline);

    // ASSERT
    assert.equal(result, true, "A second Airline should be registered instantly by the first one if the first one has funded its account");

  });

  it('(airline) can register instantly third and fourth airlines by activated/funded accounts', async () => {
    
    // ARRANGE

    // ACT
    // The second airline activates its account by paying 10 eth
    try {
        await config.flightSuretyData.fund({from: secondAirline, value: activationFee});
    }
    catch(e) {

    }

    // First airline registers the 3rd airline
    try {
        await config.flightSuretyApp.registerAirline(thirdAirline, {from: config.firstAirline});
    }
    catch(e) {
    }

    // Second airline registers the 4th airline
    try {
        await config.flightSuretyApp.registerAirline(fourthAirline, {from: secondAirline});
    }
    catch(e) {
    }
    let resultThirdAirline = await config.flightSuretyData.isAirlineRegistered.call(thirdAirline);
    let resultFourthAirline = await config.flightSuretyData.isAirlineRegistered.call(fourthAirline);

    // ASSERT
    assert.equal(resultThirdAirline, true, "It should be possible to register instantly a 3rd airline by previously activated airlines");
    assert.equal(resultFourthAirline, true, "It should be possible to register instantly a 4th airline by previously activated airlines");

  });

  it('(airline) cannot register instantly 5th airline with just one activated/funded account', async () => {
    
    // ARRANGE

    // ACT
    // First airline calls the registerAirline function for the fifth airline
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.firstAirline});
    }
    catch(e) {
    }

    let result = await config.flightSuretyData.isAirlineRegistered.call(fifthAirline);

    // ASSERT
    assert.equal(result, false, "It should not be possible to register instantly a 5th airline by previously activated airlines");
  });

  it('(airline) cannot register 5th airline by double voting from the same endorsing airline', async () => {
    
    // ARRANGE

    // ACT
    // First airline calls the registerAirline function for the fifth airline
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.firstAirline});
    }
    catch(e) {
    }

    let result = await config.flightSuretyData.isAirlineRegistered.call(fifthAirline);

    // ASSERT
    assert.equal(result, false, "It should not be possible to register 5th airline by double voting");
  });

  it('(airline) can register 5th airline once multi-party consensus is reached', async () => {
    
    // ARRANGE

    // ACT
    // First airline calls the registerAirline function for the fifth airline
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: secondAirline});
    }
    catch(e) {
    }

    let result = await config.flightSuretyData.isAirlineRegistered.call(fifthAirline);

    // ASSERT
    assert.equal(result, true, "It should be possible to register a 5th airline once multi-party consensus is reached");
  });

  it('(airline) can register a flight for insurance', async () => {
    
    // ARRANGE
    let flightNumber = 'BA3203';
    let flightTimestamp = '1623664079';
    let flightKey = web3.utils.soliditySha3(secondAirline, flightNumber, flightTimestamp);

    // ACT
    // Airline registers a flight
    try {
        await config.flightSuretyApp.registerFlight(flightNumber, flightTimestamp, {from: secondAirline});
    }
    catch(e) {

    }

    let result = (await config.flightSuretyData.flightRegister.call(flightKey)).isRegistered;

    // ASSERT
    assert.equal(result, true, "An activated airline should be able to register a flight");
  });  

  it('(passenger) can buy an insurance policy for a flight', async () => {
    
    // ARRANGE
    let flightNumber = 'BA3203';
    let flightTimestamp = '1623664079';
    let premium = web3.utils.toWei('0.5', "ether");

    // ACT
    // Passenger purchases insurance for a flight
    try {
        await config.flightSuretyData.buy(secondAirline, flightNumber, flightTimestamp, {from: passenger, value: premium});
    }
    catch(e) {

    }

    let result = await config.flightSuretyData.retrievePolicyInfo.call( 
                                                                        secondAirline, 
                                                                        flightNumber, 
                                                                        flightTimestamp,
                                                                        passenger,
                                                                        {from: passenger}
                                                                        );

    // ASSERT
    assert.equal(result.activePolicy, true, "Passenger was not able to buy insurance policy");
    assert.equal(result.passengerAddress, passenger, "Passenger passenger address is wrong");
    assert.equal(result.flightNumber, flightNumber, "Flight number is wrong");
    assert.equal(result.premiumPaid, premium, "Premium paid is wrong");
  });

  it('(passenger) is credited once the flight is late', async () => {
    
    // ARRANGE
    let flightNumber = 'BA3203';
    let flightTimestamp = '1623664079';
    let balanceCredited = web3.utils.toWei((0.5*1.5).toString(), 'ether');

    // ACT
    // Flight is declared late
    try {
        await config.flightSuretyApp.lateFlight(flightNumber, flightTimestamp, {from: secondAirline});
    }
    catch(e) {

    }

    let result = await config.flightSuretyData.retrievePolicyInfo.call( 
                                                                        secondAirline, 
                                                                        flightNumber, 
                                                                        flightTimestamp,
                                                                        passenger,
                                                                        {from: secondAirline}
                                                                        );

    // ASSERT
    assert.equal(result.currentBalanceDue, balanceCredited, "Passenger was not credited with the correct balance");
  });

  it('(passenger) can withdraw their balance', async () => {
    
    // ARRANGE
    let flightNumber = 'BA3203';
    let flightTimestamp = '1623664079';
    let premium = web3.utils.toWei('0.5', "ether");
    let balanceCredited = new BN(premium).mul(new BN('3')).div(new BN(2)).toString();

    // ACT
    // Retrieving the balance of the passenger before the withdrawal
    let balanceBefore = await web3.eth.getBalance(passenger);

    // The passenger calls the refunding function
    let result = await config.flightSuretyData.pay(secondAirline, flightNumber, flightTimestamp, {from: passenger});

    // Retrieving the balance of the passenger after the withdrawal
    let balanceAfter = await web3.eth.getBalance(passenger);

    // Calculating gas cost
    let gasPrice = await web3.eth.getGasPrice();
    let gasCost = new BN(gasPrice).mul(new BN(result.receipt.gasUsed));

    // Calculating expected balance after the transaction
    let expectedBalance = new BN(balanceBefore).add(new BN(balanceCredited)).sub(gasCost).toString();

    // ASSERT
    assert.equal(balanceAfter, expectedBalance, "Withdrawal was not successful");
  });
 

});
