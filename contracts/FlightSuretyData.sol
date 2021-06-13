pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    /*** Variables to keep track of the airline queuing process ***/
    // This mapping keeps track of which airlines have already voted for an airline
    mapping(address => mapping(address => bool)) airlineVotesRegister;
    
    // This structs keep track of the voting process and activation of airlines
    struct airlineProfile {
        uint256 votesCounter;
        bool isRegistered;
        bool isActive;  // It doesn't become true until the airline doesn't pay the 10 ether fee
    }

    mapping(address => airlineProfile) airlineRegistry; // Registry of airlines

    uint256 registeredAirlines = 0;     // This counter keeps track of the airlines which are registered
    uint256 activeAirlines = 0;         // This counter keeps trak of the airlines which have paid the registration fee

    // Activation fee constant
    uint256 activationFee = 10 ether;

    /*** Registry of authorized (Dapp) contracts ***/
    mapping(address => uint256) private authorizedContracts;

    /*** Insurance data variables ***/
    // Flight Register. Its purpose is to prevent passengers from booking non-existent flights
    struct flightInfo {
        bool isRegistered;
        uint256 timestamp;
    }

    mapping(bytes32 => flightInfo) public flightRegister;

    // Insuree List
    mapping(bytes32 => address[]) insureeList;
    
    struct insuranceData {
        bool isActive;
        address passenger;
        string flight;
        uint256 premium;
        uint256 balanceDue;
    }

    mapping(bytes32 => insuranceData) public insurancePolicy;

    // Max premium amount
    uint256 maxPremium;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    *      The address of the first line to be registered is passed to the constructor
    *      This way the first airline doesn't have to be the contract owner
    */
    constructor
                                (
                                    address firstAirline
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        airlineRegistry[firstAirline].isRegistered = true;
        registeredAirlines = registeredAirlines.add(1);
        maxPremium = 1 ether;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the authorized app account to be the function caller
    */
    modifier isCallerAuthorized() 
    {
        require(authorizedContracts[msg.sender] == 1, "Caller not authorized");
        _;
    }

    /**
    * @dev Modifier that requires an Airline to have been registered
    */
    modifier requireRegisteredAirline() 
    {
        require(airlineRegistry[msg.sender].isRegistered, "Only registered airlines can call this function");
        _;
    }

    /**
    * @dev Modifier that requires an Airline to be active(have funded the contract)
    */
    modifier requiredActivatedAirline() 
    {
        require(airlineRegistry[msg.sender].isActive, "Only registered airlines can call this function");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /**
    * @dev Updates max price to pay for insurance
    *
    */    
    function updateMaxPremium
                            (
                                uint256 amount
                            ) 
                            external
                            requireContractOwner 
    {
        maxPremium = amount;
    }    

    /********************************************************************************************/
    /*                                   RESTRICT USER ACCES FUNCTIONS                          */
    /********************************************************************************************/

    function authorizeCaller  (
                                    address appContract
                                ) 
                                external
                                requireContractOwner
    {
        authorizedContracts[appContract] = 1;
    }

    function deauthorizeCaller  (
                                    address appContract
                                ) 
                                external
                                requireContractOwner
    {
        delete authorizedContracts[appContract];
    }    

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address newAirline,
                                bool register,
                                address endorsingAirline
                            )
                            external
                            requireIsOperational
                            isCallerAuthorized
    {
        require(!airlineRegistry[newAirline].isRegistered, "This airline has already been registered");
        require(!airlineVotesRegister[newAirline][endorsingAirline], "The endorsing airline has already voted");
        airlineVotesRegister[newAirline][endorsingAirline] = true;
        airlineRegistry[newAirline].votesCounter = airlineRegistry[newAirline].votesCounter.add(1);
        airlineRegistry[newAirline].isRegistered = register;
        if (register) {
            registeredAirlines = registeredAirlines.add(1);
        }
    }

    /**
    * @dev Checks whether an airline is registered
    *      Can only be called from FlightSuretyApp contract
    *
    */  
    function isAirlineRegistered 
                                (
                                    address airline
                                )
                                external
                                view
                                returns(bool)
    {
        return airlineRegistry[airline].isRegistered;
    }

    /**
    * @dev Checks whether an airline is active
    *      Can only be called from FlightSuretyApp contract
    *
    */  
    function isAirlineActivated 
                                (
                                    address airline
                                )
                                external
                                view
                                returns(bool)
    {
        return airlineRegistry[airline].isActive;
    }

    /**
    * @dev Returns the number of votes an airline has
    *
    */  
    function getAirlineVotesCounter 
                                (
                                    address airline
                                )
                                external
                                view
                                isCallerAuthorized
                                returns(uint256)
    {
        return airlineRegistry[airline].votesCounter;
    }

    /**
    * @dev Returns the number of registered airlines
    *
    */  
    function getRegisteredAirlinesCounter
                                (
                                )
                                external
                                view
                                isCallerAuthorized
                                returns(uint256)
    {
        return registeredAirlines;
    }  

    /**
    * @dev Returns the number of active airlines
    *
    */  
    function getActiveAirlinesCounter
                                (
                                )
                                external
                                view
                                isCallerAuthorized
                                returns(uint256)
    {
        return activeAirlines;
    }    

    /**
    * @dev Registers a new flight for passengers to buy insurance on
    *
    */  
    function registerFlightForInsurance
                                (
                                    address airline,
                                    string flight,
                                    uint timestamp 
                                )
                                external
                                view
                                requireIsOperational
                                isCallerAuthorized
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flightRegister[flightKey].isRegistered = true;
        flightRegister[flightKey].timestamp = timestamp;
    } 

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (    
                                address airline,
                                string flight,
                                uint256 timestamp                                                         
                            )
                            requireIsOperational
                            external
                            payable
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        // The flight exists
        require(flightRegister[flightKey].isRegistered, "This flight doesn't exist");
        // The insurance is purchased before flight time
        require(block.timestamp < flightRegister[flightKey].timestamp, "It's too late to book this flight");
        bytes32 policyKey = keccak256(abi.encodePacked(msg.sender, flightKey));
        require(!insurancePolicy[policyKey].isActive, "This insurance has already been purchased");
        require(msg.value <= maxPremium, "Premium is above the maximum amount");
        insurancePolicy[policyKey] = insuranceData ({
                                                        isActive: true,
                                                        passenger: msg.sender,
                                                        flight: flight,
                                                        premium: msg.value,
                                                        balanceDue: 0
                                                    });
        insureeList[flightKey].push(msg.sender);
    }

    /**
    * @dev Retrieve insurance info
    *
    */   
    function retrievePolicyInfo
                            (    
                                address airline,
                                string flight,
                                uint256 timestamp,
                                address passenger                     
                            )
                            external
                            view
                            returns(
                                    bool activePolicy, 
                                    address passengerAddress, 
                                    string flightNumber, 
                                    uint256 premiumPaid,
                                    uint256 currentBalanceDue
                                    )
    {
        require(msg.sender == airline || msg.sender == passenger, "Only flight airline or insuree can access this function");
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        bytes32 policyKey = keccak256(abi.encodePacked(passenger, flightKey));
        activePolicy = insurancePolicy[policyKey].isActive;
        passengerAddress = insurancePolicy[policyKey].passenger;
        flightNumber = insurancePolicy[policyKey].flight;
        premiumPaid = insurancePolicy[policyKey].premium;
        currentBalanceDue = insurancePolicy[policyKey].balanceDue;        
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp,
                                    uint numerator,
                                    uint denominator                                  
                                )
                                requireIsOperational
                                isCallerAuthorized
                                external
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        for(uint c = 0; c < insureeList[flightKey].length; c++)
        {
            address insuree = insureeList[flightKey][c];
            bytes32 policyKey = keccak256(abi.encodePacked(insuree, flightKey));
            // The multiplying factor of the balance due is calculated in the app contract
            insurancePolicy[policyKey].balanceDue = insurancePolicy[policyKey].premium.mul(numerator).div(denominator);
            }
    }

    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address airline,
                                string flight,
                                uint256 timestamp 
                            )
                            requireIsOperational
                            external
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        bytes32 policyKey = keccak256(abi.encodePacked(msg.sender, flightKey));
        require(insurancePolicy[policyKey].isActive, "This policy is not active or it doesn't exist");
        require(insurancePolicy[policyKey].balanceDue > 0, "This policy hasn't been assigned any credit");
        uint transferAmount = insurancePolicy[policyKey].balanceDue;
        insurancePolicy[policyKey].balanceDue = 0;
        insurancePolicy[policyKey].isActive = false;
        msg.sender.transfer(transferAmount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
                            requireIsOperational
                            requireRegisteredAirline
    {
        require(!airlineRegistry[msg.sender].isActive, "This airline has already been activated");
        require(msg.value >= activationFee, "Not enough funds sent to pay for the activation fee");
        airlineRegistry[msg.sender].isActive = true;
        activeAirlines = activeAirlines.add(1);
        if (msg.value > activationFee) {
            uint256 returnedAmount = msg.value.sub(activationFee);
            msg.sender.transfer(returnedAmount);
        }
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

