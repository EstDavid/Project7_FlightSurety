import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

// Read local storage
var airlineList;
var flightList = [];

(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Check if contract is operational
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // Check if app contract is authorized
        contract.isAppAuthorized((error, result) => {
            console.log(error,result);
            if(result) {
                if(result) {
                    DOM.elid('authorize-app').innerText = 'App Contract authorized';
                    document.getElementById("authorize-app").disabled = true;
                }
            }
            else if (result == false) {
                // If App contract is not authorized, a button is activated at the top 
                // of the page whichs allows to authorize app contract on the data contract
                DOM.elid('authorize-app').addEventListener('click', () => {
                    // Write transaction
                    contract.authorizeApp( (error, result) => {    
                        console.log(error, result);
                        if(result) {
                            alert('The App contract has been authorized');
                            DOM.elid('authorize-app').innerText = 'App Contract authorized';
                            document.getElementById("authorize-app").disabled = true;
                        }          
                    });
                });
            }            
        });

        // Read airline accounts
        airlineList = contract.getAirlines();
        
        // Display the list of airlines and their status of registration
        displayAirlines(airlineList, contract);

        // Create an airline dropdown selector to simplify the process of registering new flights
        airlineSelector(airlineList);

        // Listen to OracleResponse event and update the status of the corresponding flight
        contract.listenOracleResponse((error, event) => {
            //console.log(error,result);
            if(event) {
                console.log(result);
                let eventResult = event.returnValues;
                let row = 0;
                console.log(DOM.elid(`flight-row-${row}`));
                console.log(eventResult);
                // Loop through all the flights which are displayed on the page and update the status
                // of the flight corresponding to the event
                while (document.body.contains(DOM.elid(`flight-row-${row}`))) {
                    let flightRow = DOM.elid(`flight-row-${row}`);
                    if(flightRow.children[0].innerText == eventResult.airline &&
                        flightRow.children[1].innerText == eventResult.flight && 
                        flightRow.children[2].innerText == eventResult.timestamp) {
                            flightRow.children[6].innerText = eventResult.status;
                        }
                        row += 1;
                }
            }            
        });
        
        // Display the list of flights the moment there is at least one flight on it
        if(flightList.length > 0) {
            displayFlights(flightList, contract);
        }

        // Airline registers new flight
        DOM.elid('submit-flight').addEventListener('click', (event) => {
            event.preventDefault();
            // Catch the data in the new flight form
            let newFlightForm = document.forms.flightdata;
            let flight = newFlightForm.elements.flightnumber.value;
            let airline = newFlightForm.elements.flightairline.value;
            // Write transaction on the Smart Contract
            contract.registerNewFlight(flight, airline, (error, result, payload) => {
                if(result) {
                    flightList.push([payload.airline, payload.flight, payload.timestamp]);

                    // Display the list of registered flights
                    displayFlights(flightList, contract);
                }
                if(error) {
                    alert(error);
                }
            });
        });    
    });
})();

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

// This function creates a dropdown selector of the airine addresses
function airlineSelector (airlines) {
    let airlineSelector = DOM.elid('flight-airline-selector');
    airlines.map((airline) => {
        airlineSelector.appendChild(DOM.option({value: airline, className: ' col-sm-2 text-truncate'}, airline));
    });
}

// This function displays the list of airlines, as well as the buttons which allow to register and activate them
function displayAirlines(airlines, contract) {
    let displayDiv = DOM.elid("airline-registry");
    if(document.body.contains(DOM.elid('airlines-registry'))) {
        displayDiv.removeChild(DOM.elid('airlines-registry'));
    }
    let section = DOM.form({id: 'airlines-registry', name: 'airlines'});
    // Creating the row with the headers
    let headerRow = DOM.div({className: 'row'});
    headerRow.appendChild(DOM.div({className: 'col-sm-6 field'}, "Airline address"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Sponsoring airline"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Registration"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Activation"));
    section.append(headerRow);
    let rowNumber = 0;
    // Creating the row for each airline
    airlines.map((airline) => {
        let row = DOM.div({className: 'row', id: `airline-row-${rowNumber}`});
        row.appendChild(DOM.div({className: 'col-sm-6 field text-truncate'}, airline));
        // sponsorRadio element allows to choose the airline which sponsors/registers a new airline
        let sponsorRadio = DOM.div({className: 'form-check col-sm-2'});
        sponsorRadio.appendChild(DOM.input({type: 'radio', className: 'form-check-input', name: 'airlinesponsor', value: airline}));
        row.appendChild(sponsorRadio);
        // If the airline is registered, the 'Register' button is disabled
        contract.isAirlineRegistered(airline, (error, result) => {
            let registrationText;
            let registrationButton
            if (error) {
                registrationText = "Error";
                registrationButton = DOM.button({className: 'col btn table-button', disabled: true}, registrationText);
            }
            else if (result) {
                registrationText = "Registered";
                registrationButton = DOM.button({className: 'col btn table-button', disabled: true}, registrationText);
            }
            else {
                registrationText = "Register";
                registrationButton = DOM.button({className: 'col btn btn-primary table-button', value: airline}, registrationText);
                registrationButton.addEventListener('click', function(event) {registerAirline(event, contract, airlines);});
            }
            row.appendChild(registrationButton);
        });
        // If the airline is activated, the 'Activate' button is inactive
        contract.isAirlineActivated(airline, (error, result) => {
            let activationText;
            let activationButton
            if (error) {
                activationText = "Error";
                activationButton = DOM.button({className: 'col btn table-button', disabled: true}, activationText);
            }
            else if (result) {
                activationText = "Activated";
                activationButton = DOM.button({className: 'col btn table-button', disabled: true}, activationText);
            }
            else {
                activationText = "Activate";
                activationButton = DOM.button({className: 'col btn btn-primary table-button', value: airline}, activationText);
                activationButton.addEventListener('click', function(event) {activateAirline(event, contract, airlines);});
            }
            row.appendChild(activationButton);
        });
        section.appendChild(row);
    });
    displayDiv.append(section);
}

// This function allows to register a new airline
function registerAirline(event, contract, airlines) {
    event.preventDefault();
    let airlineForm = document.forms.airlines;
    // The address of the sponsoring airline is retrieved from the radio input selector
    let sponsoringAirline = airlineForm.elements.airlinesponsor.value;
    let newAirline = event.target.value;
    contract.registerAirline(newAirline, sponsoringAirline, (error, result) => {
        if (error) {
            alert(error);
        }
        if (result) {
            alert("Hash of the transaction: " + result);
        } 
        displayAirlines(airlines, contract);             
    });
}

// This function allows an airline to pay the 10 ETH funding fee and be activated
function activateAirline(event, contract, airlines) {
    event.preventDefault();
    let newAirline = event.target.value;
    let airlineRow = event.target.parentNode;
    let subFormRow = DOM.div({className: 'row'});
    subFormRow.appendChild(DOM.label({className: 'col-sm-4'}, 'Funding amount\n 10 ETH min.'));
    subFormRow.appendChild(DOM.input({id:'fund-amount', className: 'col-sm-4', type: 'number', step: '0.1'}));
    let fundButton = DOM.button({id: `function-button`, className: 'col-sm-2 btn btn-success table-button'}, 'Fund');
    fundButton.addEventListener('click', function(event) {
        event.preventDefault();
        let fundAmount = DOM.elid('fund-amount').value;
        contract.activateAirline(newAirline, fundAmount, (error, result) => {
            if (error) {
                alert(error);
            }
            if (result) {
                alert("Hash of the transaction: " + result);
            }
            displayAirlines(airlines, contract);            
        });
    });
    subFormRow.appendChild(fundButton);
    airlineRow.insertAdjacentElement("afterend", subFormRow);
}

// This function shows all the flights which have been registered on the current browser session
function displayFlights(flights, contract) {
    let displayDiv = DOM.elid("flight-registration");
    let sectionId = "flights-section";
    let rowNumber = 0;
    var previousSection = DOM.elid(sectionId);
    if(document.getElementById(sectionId)) {
        displayDiv.removeChild(previousSection);
    }
    let section = DOM.section({id:sectionId});
    section.appendChild(DOM.hr());
    section.appendChild(DOM.h2("List of current flights"));
    // Create the header row
    let row = section.appendChild(DOM.div({className:'row'}));
    let columnNames = ['Airline address', 'Flight number', 'Timestamp', 'Fetch Status', 'Buy Insurance', 'Check/Claim insurance', 'Flight Status'];
    for(let name of columnNames) {
        row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, name));        
    }
    // Create the rows with flight information and the buttons to interact with the flights
    flights.map((flight) => {
        let row = section.appendChild(DOM.div({id: `flight-row-${rowNumber}`, className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm field-value text-truncate'}, flight[0]));
        row.appendChild(DOM.div({className: 'col-sm field'}, flight[1]));
        row.appendChild(DOM.div({className: 'col-sm field-value'}, flight[2].toString()));
        let fetchButton = DOM.button({className: 'col-sm btn btn-primary table-button'}, "Fetch");
        let buyButton = DOM.button({className: 'col-sm btn btn-success table-button'}, "Buy");
        let checkButton = DOM.button({className: 'col-sm btn btn-info table-button'}, "Check/Claim");
        fetchButton.addEventListener('click', function(event) {fetchFlightStatus(event, flight, contract)});
        buyButton.addEventListener('click', function(event) {buyFlightInsurance(event, flight, contract)});
        checkButton.addEventListener('click', function(event) {checkInsuranceStatus(event, flight, contract)});
        row.appendChild(fetchButton);
        row.appendChild(buyButton);
        row.appendChild(checkButton);
        contract.getFlightStatus(flight[0], flight[1], flight[2], (error, result) => {
            row.appendChild(DOM.div({className: 'col-sm field-value'}, error ? String(error) : String(result)));
        });
        rowNumber += 1;
    })
    displayDiv.append(section);
}

// This function triggers the OracleRequest to update the status of a flight
function fetchFlightStatus(event, flight, contract) {
    event.preventDefault();
    let fetchAirline = flight[0];
    let fetchFlight = flight[1];
    let fetchTimestamp = flight[2];
    contract.fetchFlightStatus(fetchAirline, fetchFlight, fetchTimestamp, (error, result) => {
        if(error) {
            alert(error);
        }
        console.log(error);
        console.log(result);
    });    
}

// This function creates a dialog under a flight whichs allows the user to enter their passenger address
// and the amount they want to pay for the insurance
function buyFlightInsurance(event, flight, contract) {
    event.preventDefault();
    // Read the flight data of the row
    let flightRow = event.target.parentNode;
    let fetchAirline = flight[0];
    let fetchFlight = flight[1];
    let fetchTimestamp = flight[2];
    let section = DOM.form({id: 'purchase-insurance', name: 'purchaseinsurance'});
    let headerRow = DOM.div({className: 'row field'});
    let subFormRow = DOM.div({className: 'row subform'});
    let passengerAddressInput = DOM.input({name: 'insurancepassenger', className: 'col-sm-4', type: 'text', placeholder: 'Passenger address'});
    // The premium input has a max value of 1 ETH and can be entered in increments of 0.01 ETH
    let premiumInput = DOM.input({name: 'insurancepremium', className: 'col-sm-3', type: 'number', step: '0.01', min: '0', max: '1'});
    headerRow.appendChild(DOM.label({className: 'col-sm-4'}, 'Passenger address'));
    headerRow.appendChild(DOM.label({className: 'col-sm-3'}, 'Premium'));
    subFormRow.appendChild(passengerAddressInput);
    subFormRow.appendChild(premiumInput);
    let rowButton = DOM.input({type: 'submit', className: 'col-sm-2 btn btn-success table-button', value: 'Purchase'});
    let passengerAddress;
    let premium;
    subFormRow.appendChild(rowButton);
    // On submission of the form, the 'buy' function of the Smart Contract is called
    section.addEventListener('submit', (event) => {
        event.preventDefault();
        passengerAddress = passengerAddressInput.value;
        premium = premiumInput.value;
        contract.buy(fetchAirline, fetchFlight, fetchTimestamp, premium, passengerAddress, (error, result) => {
            if(error) {
                alert(error);
            }
            if(result) {
                alert(`Your flight insurance worth ${premium} ETH for flight ${fetchFlight} on ${fetchTimestamp} has been purchased.\nThank you!`);
                flightRow.parentNode.removeChild(section);
            }
        });
    });
    section.appendChild(headerRow);
    section.appendChild(subFormRow);
    flightRow.insertAdjacentElement("afterend", section);
}

// This function creates a dialog under a flight whichs allows the user to enter their passenger address
// and check how much they paid for their insurance, know if they have been credited any refund and trigger
// the Smart Contract function which pays them in case the flight was late
function checkInsuranceStatus(event, flight, contract) {
    event.preventDefault();
    // Read the flight data of the row
    let flightRow = event.target.parentNode;
    let fetchAirline = flight[0];
    let fetchFlight = flight[1];
    let fetchTimestamp = flight[2];
    let section = DOM.form({id: 'check-insurance', name: 'checkinsurance'});
    let headerRow = DOM.div({className: 'row field'});
    let subFormRow = DOM.div({className: 'row subform'});
    let passengerAddressInput = DOM.input({name: 'insurancepassenger', className: 'col-sm-5', type: 'text', placeholder: 'Passenger address'});
    headerRow.appendChild(DOM.label({className: 'col-sm-4'}, 'Passenger address'));
    subFormRow.appendChild(passengerAddressInput);
    let checkButton = DOM.input({type: 'submit', className: 'col-sm-2 btn btn-info table-button', value: 'Check insurance'});
    let claimButton = DOM.input({type: 'submit', className: 'col-sm-2 btn btn-danger table-button', value: 'Claim insurance'});
    let passengerAddress;
    subFormRow.appendChild(checkButton);
    subFormRow.appendChild(claimButton);
    section.appendChild(headerRow);
    section.appendChild(subFormRow);
    flightRow.insertAdjacentElement("afterend", section);
    // On submission of the form, the corresponding 'getInsuranceStatus' or 
    // 'claimInsurance' funtions of the Smart Contract are called
    section.addEventListener('submit', (event) => {
        event.preventDefault();
        passengerAddress = passengerAddressInput.value;
        if(event.submitter.value == 'Check insurance') {
            contract.getInsuranceStatus(fetchAirline, fetchFlight, fetchTimestamp, passengerAddress, (result) => {
                console.log(result);
                if(result) {
                    alert(`Your insurance premium for flight ${fetchFlight} is ${result[0]} ETH\nYour current balance due is ${result[1]} ETH\nThank you!`);
                    flightRow.parentNode.removeChild(section);
                }
            });
        } else if(event.submitter.value == 'Claim insurance') {
            contract.claimInsurance(fetchAirline, fetchFlight, fetchTimestamp, passengerAddress, (error, result) => {
                if(error) {
                    alert(error);
                }
                console.log(result);
                if(result) {
                    console.log(result);
                    alert(`The balance due has been refunded to your account`);
                    flightRow.parentNode.removeChild(section);
                }
            });
        }
    });
}