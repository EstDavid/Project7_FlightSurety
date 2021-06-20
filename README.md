# Flight Surety project
This repository contains an Ethereum Flight Insurance DApp which includes an Oracle Server 

![main page](images/1_InitialScreen.PNG)

## Dapp Overview

### Initial deployment
When migrating the Smart Contracts for the first time, the Dapp shows on the top of the page an active button which allows to authorize the App Contract to call the functions of the Data Contract.

![authorize contract](images/1_InitialScreen_authorize.PNG)

Once the App Contract is authorized, the button is disabled

![contract authorized](images/1_InitialScreen_authorized.PNG)


### Registration of airlines

A list is shown with the 5 accounts which are retrieved from Ganache and will be used as airline accounts. On initial deployment only the first account is registered. 

![initial airlines list](images/2_AirlineRegistry_Initial.PNG)

The list contains two buttons, 'register' and 'activate'.

The 'register' button allows an airline which has already funded the Data Contract (is activated) to register another airline. 
In order to do this in the Dapp, we select the sponsoring airline in the corresponding column and then click on 'register' on the airline which we want to register

![initial airlines list](images/2_AirlineRegistry_Registering.PNG)

In order to fund, or activate and airline, we click on the corresponding 'Activate' button once it is registered. A new form appears under the airline which allows to specify the amount to funding that we want to send. We click on 'Send' and the airline is activated.

![initial airlines list](images/2_AirlineRegistry_Activating.PNG)

### Registration of flights

Flights need to be registered in the Data Contract. In order to do this, we enter the flight number, select the airline which operates the flight and then click on 'Register flight'

![initial airlines list](images/3_FlightRegistry_NewFlight.PNG)

The flight will appear on the 'List of current flights'.

### List of current flights

The list of current flights shows the main flight information (flight number, airline address, timestamp), as well as the status of the flight. Three buttons are included in order to manage the different functions dealing with a flight.

![initial airlines list](images/4_ListFlights_Initial.PNG)

The list shows the flights that have been registered during the current browser session, it doesn't show the all the flights which are active on the Data Smart Contract.


## Program version numbers
Truffle v5.2.3 (core: 5.2.3)
Solidity v0.5.16 (solc-js)
Node v10.19.0
Web3.js v1.2.9

## Roles
There are 4 different roles in this DApp, apart from the owner of the contract:
- Farmer => A Farmer is able to harvest beans and provide the batch with the data of the Farm (Name, Information, Latitude and Longitude, as well as Notes about the bacth itself). After harvesting them, the Farmer is able to process them, pack them and then set a price and put them for sale.
- Factory => A Factory is able to buy beans which are for sale, grind them, make chocolate and them ship the chocolate to a Distributor of their choice. 
- Distributor => A Distributor is able to receive chocolate, give it a brand of their choice and put it up for sale.
- Consumer => A Consumer is able to purchase chocolate from a Distributor

## Activity Diagram

![activity diagram](images/Supplychain-Activity.png)

## Sequence Diagram

![sequence diagram](images/Supplychain-Sequence.png)

## State Diagram

![state diagram](images/Supplychain-State.png)

## Classes

![state diagram](images/Supplychain-Data_Modelling.png)


## Frontend functionality
The frontend allows to try all functionailities of the Supply Chain. 

It is divided into 8 sections.

### Product Overview
The product overview allows to set the SKU and UPC of the batch we want to either process or view. The 'Fetch Data' button allows to view all the details of a certain batch on the 'Product Details' section
![product overview](images/frontend1.PNG)

### Role management
This section allows to interact with the roles of the smart contract and add new addresses to the different roles of the Supply Chain. From this section it is possible to add a new farmer, a new distributor or a new consumer.
![role management](images/frontend2.PNG)

### Product Details
Here it is possible to visualize all the different attributes of a specific batch. We select the batch we want to see in the 'Product Overview' section and click on the 'Fetch Data' button. This button calls a javascript function which collects all data from the fetchItemBufferOne, fetchItemBufferTwo and fetchItemBufferThree functions of the smart contract.
![product details](images/frontend3.PNG)

### Farm Details
Here the farmer is able to add the information about the farm. This information will remain unchanged for that specific batch of beans/chocolate
![farm details](images/frontend4.PNG)

### Cacao Beans Details
This section allows the farmer to input the information about a specific batch of beans (Product Notes), as well as the price for that batch.
It also contains the 'Buy beans' button which allows a factory to buy a batch of beans. After this, the factory is able to use the 'Grind beans' and 'Make chocolate' functions.
![cacao beans details](images/frontend5.PNG)

### Send Chocolate to Distributor
This field is used by a factory to send a batch of chocolate to a distributor
![send chocolate to distributor](images/frontend6.PNG)

### Receive, Brand and Sell Chocolate
In this section a distributor is able to use the 'Receive chocolate' function, define a chocolate brand for a btach of chocolate and put it up for sale.
The 'Purchase chocolate' button is used by the consumer to buy chocolate
![receive brand and sell chocolate](images/frontend7.PNG)

### Transaction History
Here is possible to see all the events generated during a session interactin with the supply chain
![transaction history](images/frontend8.PNG)

## Areas for further development
There is a couple of areas which could be improved by dedicating some more time to the project:
- Improve functionality of transfer of chocolate between the factory and the distributor. At this moment the factory ships the chocolate to the distriutor they choose, regardless of whether that distributor wants the batch or not. Once the shipment function is called successfully, it is only up to the distributor to receive the chocolate and move it up the chain. It isn't possible for them to reject the shipment-
- Improve frontend. The frontend could be improved with better visuals and the use of images for each product. Also The different sections could be distributed in different pages depending on the role of the user.

## Built With

* [Ethereum](https://www.ethereum.org/) - Ethereum is a decentralized platform that runs smart contracts
* [IPFS](https://ipfs.io/) - IPFS is the Distributed Web | A peer-to-peer hypermedia protocol
to make the web faster, safer, and more open.
* [Truffle Framework](http://truffleframework.com/) - Truffle is the most popular development framework for Ethereum with a mission to make your life a whole lot easier.

## Acknowledgments

* Solidity
* Ganache-cli
* Truffle
