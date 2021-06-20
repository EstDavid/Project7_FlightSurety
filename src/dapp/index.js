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
                // Authorize app contract on the data contract
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
        
        displayAirlines(airlineList, contract);

        airlineSelector(airlineList);

        contract.listenOracleResponse((error, event) => {
            //console.log(error,result);
            if(event) {
                console.log(result);
                let eventResult = event.returnValues;
                let row = 0;
                console.log(DOM.elid(`flight-row-${row}`));
                console.log(eventResult);
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
        
        if(flightList.length > 0) {
            displayFlights(flightList, contract);
        }

        // Airline registers new flight
        DOM.elid('submit-flight').addEventListener('click', (event) => {
            event.preventDefault();
            let newFlightForm = document.forms.flightdata;
            console.log(newFlightForm);
            let flight = newFlightForm.elements.flightnumber.value;
            let airline = newFlightForm.elements.flightairline.value;
            // Write transaction
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

function airlineSelector (airlines) {
    let airlineSelector = DOM.elid('flight-airline-selector');
    airlines.map((airline) => {
        airlineSelector.appendChild(DOM.option({value: airline, className: ' col-sm-2 text-truncate'}, airline));
    });
}

function displayAirlines(airlines, contract) {
    let displayDiv = DOM.elid("airline-registry");
    if(document.body.contains(DOM.elid('airlines-registry'))) {
        displayDiv.removeChild(DOM.elid('airlines-registry'));
    }
    let section = DOM.form({id: 'airlines-registry', name: 'airlines'});
    let headerRow = DOM.div({className: 'row'});
    headerRow.appendChild(DOM.div({className: 'col-sm-6 field'}, "Airline address"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Sponsoring airline"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Registration"));
    headerRow.appendChild(DOM.div({className: 'col-sm-2 field'}, "Activation"));
    section.append(headerRow);
    let rowNumber = 0;
    airlines.map((airline) => {
        let row = DOM.div({className: 'row', id: `airline-row-${rowNumber}`});
        row.appendChild(DOM.div({className: 'col-sm-6 field text-truncate'}, airline));
        let sponsorRadio = DOM.div({className: 'form-check col-sm-2'});
        sponsorRadio.appendChild(DOM.input({type: 'radio', className: 'form-check-input', name: 'airlinesponsor', value: airline}));
        row.appendChild(sponsorRadio);
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

function registerAirline(event, contract, airlines) {
    event.preventDefault();
    let airlineForm = document.forms.airlines;
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
    let row = section.appendChild(DOM.div({className:'row'}));
    let columnNames = ['Airline address', 'Flight number', 'Timestamp', 'Fetch Status', 'Buy Insurance', 'Check/Claim insurance', 'Flight Status'];
    for(let name of columnNames) {
        row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, name));        
    }
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

function fetchFlightStatus(event, flight, contract) {
    event.preventDefault();
    let fetchAirline = flight[0];
    let fetchFlight = flight[1];
    let fetchTimestamp = flight[2];
    contract.fetchFlightStatus(fetchAirline, fetchFlight, fetchTimestamp, (error, result) => {
        console.log(error);
        console.log(result);
    });    
}

function buyFlightInsurance(event, flight, contract) {
    event.preventDefault();
    let flightRow = event.target.parentNode;
    let fetchAirline = flight[0];
    let fetchFlight = flight[1];
    let fetchTimestamp = flight[2];
    let section = DOM.form({id: 'purchase-insurance', name: 'purchaseinsurance'});
    let headerRow = DOM.div({className: 'row field'});
    let subFormRow = DOM.div({className: 'row subform'});
    let passengerAddressInput = DOM.input({name: 'insurancepassenger', className: 'col-sm-4', type: 'text', placeholder: 'Passenger address'});
    let premiumInput = DOM.input({name: 'insurancepremium', className: 'col-sm-3', type: 'number', step: '0.01', min: '0', max: '1'});
    headerRow.appendChild(DOM.label({className: 'col-sm-4'}, 'Passenger address'));
    headerRow.appendChild(DOM.label({className: 'col-sm-3'}, 'Premium'));
    subFormRow.appendChild(passengerAddressInput);
    subFormRow.appendChild(premiumInput);
    let rowButton = DOM.input({type: 'submit', className: 'col-sm-2 btn btn-success table-button', value: 'Purchase'});
    let passengerAddress;
    let premium;
    subFormRow.appendChild(rowButton);
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

function checkInsuranceStatus(event, flight, contract) {
    event.preventDefault();
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
    section.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log(event);
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