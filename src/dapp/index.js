
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
                    displayFlights(flightList, contract);

                    let row = 0;        
                    while (DOM.elid(`fetch-row-${row}`) !== undefined) {
                        console.log(row);
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
                            contract.buy(fetchAirline, fetchFlight, fetchTimestamp, 0.5, (error, result) => {
                                console.log(error);
                                console.log(result);
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

/*             for(let i = 3; i < flightsSection.children.length; i++) {
                flightsSection.children[i].children[4].addEventListener('click', (event) => {
                    console.log(event);
                    let flightRow = event.target.parentNode;
                    let fetchAirline = flightRow.children[0].innerText;
                    let fetchFlight = flightRow.children[1].innerText;
                    let fetchTimestamp = flightRow.children[2].innerText;
                    contract.fetchFlightStatus(fetchAirline, fetchFlight, fetchTimestamp, (error, result) => {
                        console.log(error);
                        console.log(result);
                    });
                })
            } */
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
        })
    
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
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Airline address"));
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Flight number"));
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Timestamp"));
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Flight Status"));
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Fetch Status"));
    row.appendChild(DOM.div({className: 'col-sm', align: 'center'}, "Buy Insurance"));
    flights.map((flight) => {
        let row = section.appendChild(DOM.div({id: `flight-row-${rowNumber}`, className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm field-value text-truncate'}, flight[0]));
        row.appendChild(DOM.div({className: 'col-sm field'}, flight[1]));
        row.appendChild(DOM.div({className: 'col-sm field-value'}, flight[2].toString()));
         contract.getFlightStatus(flight[0], flight[1], flight[2], (error, result) => {
            row.appendChild(DOM.div({className: 'col-sm field-value'}, error ? String(error) : String(result)));
        });
        let fetchButton = DOM.button({id: `fetch-row-${rowNumber}`, className: 'col-sm btn btn-primary table-button'}, "Fetch");
        let buyButton = DOM.button({id: `buy-row-${rowNumber}`, className: 'col-sm btn btn-success table-button'}, "Buy");
        row.appendChild(fetchButton);
        row.appendChild(buyButton);
        rowNumber += 1;
    })
    displayDiv.append(section);
}

function buyFlightInsurance() {

}