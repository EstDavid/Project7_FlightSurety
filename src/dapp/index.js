import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

// Read local storage
var airlineList;
var flightList = [];

(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // Read airline accounts
        airlineList = contract.getAirlines();
/*         if(localStorage.getItem("airlines")) {
            airlineList = JSON.parse(localStorage["airlines"]);
        }
        else {
            airlineList = contract.getAirlines();
            localStorage["airlines"] = JSON.stringify(airlineList);
        } */

        
        
        displayAirlines(airlineList, contract);

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
                            flightRow.children[5].innerText = eventResult.status;
                        }
                        row += 1;
                }
            }            
        });
        
        // Read list of flights
/*         if(localStorage.getItem("flights")) {
            flightList = JSON.parse(localStorage["flights"]);
            console.log(localStorage.getItem("flights"));
            console.log(flightList);
        } */
        
        if(flightList.length > 0) {
            displayFlights(flightList, contract);
        }

        // Authorize app contract on the data contract
        DOM.elid('authorize-app').addEventListener('click', () => {
            // Write transaction
            contract.authorizeApp( (error, result) => {                
            });
        })

        // New airline submit transaction
        DOM.elid('submit-airline').addEventListener('click', () => {
            let airline = DOM.elid('new-airline-address').value;
            let sponsor = DOM.elid('airline-sponsor').value;
            // Write transaction
            contract.registerAirline(airline, sponsor, (error, result) => {
                
            });
            window.location.reload();
        })

        // Airline funding transaction
        DOM.elid('fund-airline').addEventListener('click', () => {
            let Airline = DOM.elid('activating-airline-address').value;
            let fee = DOM.elid('fund-fee').value;
            // Write transaction
            contract.activateAirline(Airline, fee, (error, result) => {
                console.log(error);
                console.log(result);                
            });
            window.location.reload();
        })

        // Airline registers new flight
        DOM.elid('submit-flight').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let airline = DOM.elid('flight-airline').value;
            // Write transaction
            contract.registerNewFlight(flight, airline, (error, result) => {
                if(result) {
                    flightList.push([result.airline, result.flight, result.timestamp]);

                    // Display the list of registered flights
                    displayFlights(flightList, contract);

                    // Add the events for the fetch and buy buttons
                    let row = 0;        
                    while (document.body.contains(DOM.elid(`fetch-row-${row}`))) {
                        let fetchButton = DOM.elid(`fetch-row-${row}`);
                        let buyButton = DOM.elid(`buy-row-${row}`);
                        fetchButton.addEventListener('click', (event) => {
                            let flightRow = event.target.parentNode;
                            let fetchAirline = flightRow.children[0].innerText;
                            let fetchFlight = flightRow.children[1].innerText;
                            let fetchTimestamp = flightRow.children[2].innerText;
                            contract.fetchFlightStatus(fetchAirline, fetchFlight, fetchTimestamp, (error, result) => {
                                console.log(error);
                                console.log(result);
                            });
                        });
                        buyButton.addEventListener('click', (event) => {
                            let flightRow = event.target.parentNode;
                            let fetchAirline = flightRow.children[0].innerText;
                            let fetchFlight = flightRow.children[1].innerText;
                            let fetchTimestamp = flightRow.children[2].innerText;
                            let subForm = DOM.div({className: 'top-20'});
                            flightRow.insertAdjacentElement("afterend", subForm);
                            subForm.appendChild(DOM.label({className: 'form'}, 'Passenger address'));
                            let passengerAddressInput = DOM.input({id: 'input-field-0', type: 'text', placeholder: 'Passenger address'}, 'Passenger address');
                            subForm.appendChild(passengerAddressInput);
                            subForm.appendChild(DOM.label({className: 'form'}, 'Premium'));
                            let premiumInput = DOM.input({id: 'input-field-1', type: 'number', step: '0.01', min: '0', max: '1'}, 'Passenger address');
                            subForm.appendChild(premiumInput);
                            let rowButton = DOM.button({id: `function-button`, className: 'col-sm btn btn-success table-button'}, "purchase");
                            let passengerAddress;
                            let premium;
                            subForm.appendChild(rowButton);
                            rowButton.addEventListener('click', () => {
                                passengerAddress = passengerAddressInput.value;
                                premium = premiumInput.value;
                                contract.buy(fetchAirline, fetchFlight, fetchTimestamp, premium, passengerAddress, (error, result) => {
                                    if(result) {
                                        alert(`Your flight insurance worth ${premium} ETH for flight ${fetchFlight} on ${fetchTimestamp} has been purchased.\nThank you!`)
                                    }
                                });
                            });
                        });
                        row += 1;                
                    }
                }
                if(error) {
                    alert(error);
                }
            });
            let flightsSection = DOM.elid('flight-list');
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp + ' ' + result.airline} ]);
            });
        })

        // Passenger buys insurance
        DOM.elid('submit-flight-insurance').addEventListener('click', () => {
            let flight = DOM.elid('insurance-flight-number').value;
            let premium = DOM.elid('insurance-premium').value;
            let timestamp = DOM.elid('insurance-timestamp').value;
            let airline = DOM.elid('insurance-address').value;
            // Write transaction
            contract.buy(airline, flight, timestamp, premium, (error, result) => {
                display('Insurance Policy', 'Policy Details', [ { label: 'Policy Details', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });
    
    });

/*     function submitFlightToOracles(event) {
        event.preventDefault();
        let flightRow = event.target.parentNode;
        let fetchAirline = flightRow.children[0].innerText;
        let fetchFlight = flightRow.children[1].innerText;
        let fetchTimestamp = flightRow.children[2].innerText;
        contract.fetchFlightStatus(fetchAirline, fetchFlight, fetchTimestamp, (error, result) => {
            console.log(error);
            console.log(result);
        });
    } */
    

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

function displayAirlines(airlines, contract) {
    let displayDiv = DOM.elid("airline-registry");
    let section = DOM.section();
    section.appendChild(DOM.h2("List of airline addresses"));
    let table = DOM.table();
    table.appendChild(DOM.th({className: 'col-sm field'}, "Airline address"));
    table.appendChild(DOM.th({className: 'col-sm field'}, "Is Registered"));
    table.appendChild(DOM.th({className: 'col-sm field'}, "Is Activated"));
    airlines.map((airline) => {
        let row = table.appendChild(DOM.tr());
        row.appendChild(DOM.td({className: 'col-sm field text-truncate'}, airline));
        contract.isAirlineRegistered(airline, (error, result) => {
            row.appendChild(DOM.td({className: 'col-sm field-value'}, error ? String(error) : String(result)));
        });
        contract.isAirlineActivated(airline, (error, result) => {
            row.appendChild(DOM.td({className: 'col-sm field-value'}, error ? String(error) : String(result)));
        });
        table.appendChild(row);
    })
    section.append(table);
    displayDiv.append(section);
}

function displayFlights(flights, contract) {
    let displayDiv = DOM.elid("flight-list");
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
    let columnNames = ['Airline address', 'Flight number', 'Timestamp', 'Buy Insurance', 'Fetch Status', 'Flight Status'];
    for(let name of columnNames) {
        row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, name));        
    }
    flights.map((flight) => {
        let row = section.appendChild(DOM.div({id: `flight-row-${rowNumber}`, className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm field-value text-truncate'}, flight[0]));
        row.appendChild(DOM.div({className: 'col-sm field'}, flight[1]));
        row.appendChild(DOM.div({className: 'col-sm field-value'}, flight[2].toString()));
        row.appendChild(DOM.button({id: `fetch-row-${rowNumber}`, className: 'col-sm btn btn-primary table-button'}, "Fetch"));
        row.appendChild(DOM.button({id: `buy-row-${rowNumber}`, className: 'col-sm btn btn-success table-button'}, "Buy"));
        contract.getFlightStatus(flight[0], flight[1], flight[2], (error, result) => {
            row.appendChild(DOM.div({className: 'col-sm field-value'}, error ? String(error) : String(result)));
        });
        rowNumber += 1;
    })
    displayDiv.append(section);
}