/**
 * In this part, 
 * first, initialize all routers, put them in a routers dictionary, {id: Router};
 * second, promt user for order
 * 
 * C: continue, call originate_packet() on all routers;
 * Q: quit; finish;
 * P id: call routers[id].print_routing_table();
 * S id: shut down a router; 
 * QUESTION: WHAT DOES IT MEAN, DELETE THE ROUTER, OR SET COSTS TO INFINITY?
 * ANSWER: stop it from receiving or sending packets. can use a flag to achieve this.
 * T id: start up a router;
 * QUESTION: DOES IT MEAN TO RESET COSTS OF INFINITY? OR OTHER OPERATION?
 * ANSWER: recover it from shut down. so create a boolean flag is good enough to achieve shut and start.
 * just change the cost to Infinity
 */
import * as fs from 'fs';
import {Router} from './Router';
import * as readline from 'readline-Sync';

function initialize_routers(filename: string): {[key:string]: Router} {
     //read in data
    let routers:{[key:string]:Router} = {};
    let data: any = fs.readFileSync(filename, 'utf8');
    data = data.split('\n');
    let temp_id = null;
    let temp_network_name = null;
    let temp_router = null;
    for (let line of data) {
        line = line.trim();
        let items = line.split(/[ ]+/g);
        if (items.length > 2) {
            throw "input format is incorrect, it supposed to be 'id network_name'.";
        }
        if (items.length > 1 && items[1].search(/\w+\.\w+\.\w+/g) > -1) {
            temp_id = items[0];
            temp_network_name = items[1]
            temp_router = new Router(temp_id, temp_network_name);
            routers[temp_id] = temp_router;
        } else {
            let neighbor_id = null;
            let link_cost = null;
            if (items.length > 1) { //has predefined cost
                //assert.notEqual(temp_router, null, "router has not yet been initialized");
                neighbor_id = items[0];
                link_cost = Number(items[1]);           
            }else {
                neighbor_id = items[0];
                link_cost = 1;
            }
            temp_router.add_reference(neighbor_id, link_cost);
            temp_router.add_graph_edges(temp_id, neighbor_id, link_cost);
        }
    }
    //add access to neighbor router instances in each router
    //such that it can send packet to neighbors by calling their
    //receive_packet() method.
    for (let key in routers){
        let router = routers[key];
        for (let neighbor_key of router.get_keys_from_references()){
            router.add_neighbor(routers[neighbor_key]);
        }
    }
    //console.log(routers);
    return routers;
}

function continue_session(routers:{[key:string]:Router}){
    //originiate package for each router
    for (let router_key in routers) {
        routers[router_key].originate_packet();
    }
}

function shutdown(router: Router){
    router.shutdown();
}

function resume(router: Router) {
    router.resume();
}

function send_message(routers: {[key: string]: Router}, information: Array<string>){
    let source_id: string = information[0];
    let target_id: string = information[1];
    let message: string = information[2];
    let source_router = routers[source_id];
    source_router.originate_message(target_id, message);
}


function print_routing_table(router: Router) {
    router.print_routing_table();
}
function prompt_user_for_input(router_ids:Set<string>): Array<string> {
    let id_values: string = "";
    for (let id of router_ids) {
        id_values = id_values + id + " ";
    }
    console.log('\x1b[32m%s\x1b[0m', `Existing router ids are ${id_values.substring(0,id_values.length - 1)}.`)
    console.log("Please enter your order for next operation. Enter 'H' for order instructions.\n");
    let order_symbols = new Set(['P', 'S', 'T']);
    let order: string = readline.question(">> ");
    let inputs: Array<string> = order.trim().split(/[ ]+/g);
    if (inputs.length == 2) {
        if (order_symbols.has(inputs[0])) {
            if (router_ids.has(inputs[1])) {
                return inputs;
            } else {
                console.log('\x1b[31m%s\x1b[0m', `Error: router ${inputs[1]} does not exist.`);
                return prompt_user_for_input(router_ids);
            }
        } else {
            console.log('\x1b[31m%s\x1b[0m', `Error: ${inputs[0]} is invalid order symbol.`);
            console.log('\x1b[32m%s\x1b[0m', "Order symbols are 'C', 'P', 'S', 'T', or 'Q'.")
            return prompt_user_for_input(router_ids);
        }
    }else if (inputs.length == 1) {
        if (inputs[0] == 'C' || inputs[0] == 'Q') {
            return inputs;
        } 
        else if (inputs[0] == 'H') {
            order_hints();
            return prompt_user_for_input(router_ids);
        }
        else if (inputs[0] == 'D') {
            return inputs;
        }
        else if (order_symbols.has(inputs[0])) {
            console.log('\x1b[31m%s\x1b[0m', `Error: ${inputs[0]} must be followed by a router id.` );
            return prompt_user_for_input(router_ids);
        } 
        else {
            console.log('\x1b[31m%s\x1b[0m', `Error: ${inputs[0]} is invalid order symbol.`);
            console.log('\x1b[32m%s\x1b[0m', "Order symbols are 'C', 'P', 'S', 'T', or 'Q'.");
            return prompt_user_for_input(router_ids);
        }
    } 
    else {
        console.log('\x1b[31m%s\x1b[0m', "Error: received more than one argument.");
        console.log("Enter only one argument after your order symbol.");
        return prompt_user_for_input(router_ids);
    }
}

function implement_order(routers:{[key:string]:Router}, order: Array<string>): boolean {
    let stop = false;
    let id_values: string = "";
    for (let id in routers) {
        id_values = id_values + id + " ";
    }

    switch(order[0]) {
        //continue
        case ('C'): {
            continue_session(routers);
            break;
        }
        //quit
        case ('Q'): {
            console.log("Program terminated.\nBye.");
            stop = true;
            break;
        }
        //shutdown
        case ('S'): {
            shutdown(routers[order[1]]);
            break;
        }
        //resume
        case ('T'): {
            resume(routers[order[1]]);
            break;
        }
        case ('D'): {
            let info = ask_for_message(id_values);
            if (info != null) {
                send_message(routers, info);
            }
            break;
        }
        //print routing table
        case ('P'): {
            print_routing_table(routers[order[1]]);
            break;
        }
        //default: do nothing and quit
        default: {
            console.log("default order is to do nothing and quit.\nBye.");
            stop = true;
            break;
        }
    }
    return stop;
}

function ask_for_message(id_values: string){
    console.log('\x1b[32m%s\x1b[0m', `Existing router ids are ${id_values.substring(0,id_values.length - 1)}.`)
    console.log("Enter source router id:");
    let source_id: string = readline.question(">> ");
    let valid_source = false;
    let id_set = new Set(id_values.trim().split(/[ ]+/g));
    while (!valid_source) {
        source_id = source_id.trim();
        if (id_set.has(source_id)) {
            valid_source = true;
        } else if (source_id == 'Q') {
            return;
        } 
        else {
            console.log('\x1b[31m%s\x1b[0m', `Error: router ${source_id} does not exist.`);
            console.log('\x1b[32m%s\x1b[0m', `Existing router ids are ${id_values.substring(0,id_values.length - 1)}.`)
            console.log("Enter source router id, or type 'Q' to cancel message sending.");
            source_id = readline.question(">> ");
        }
    }
    console.log('\x1b[32m%s\x1b[0m', `Existing router ids are ${id_values.substring(0,id_values.length - 1)}.`)
    console.log("Enter target router id:");
    let target_id: string = readline.question(">> ");
    let valid_target = false;
    while (!valid_target) {
        target_id = target_id.trim();
        if (id_set.has(target_id)) {
            valid_target = true;
        } else if (target_id == 'Q') {
            return null;
        } 
        else {
            console.log('\x1b[31m%s\x1b[0m', `Error: router ${target_id} does not exist.`);
            console.log('\x1b[32m%s\x1b[0m', `Existing router ids are ${id_values.substring(0,id_values.length - 1)}.`)
            console.log("Enter source router id, or type 'Q' to cancel message sending.");
            target_id = readline.question(">> ");
        }
    }
    console.log("Enter the message content:");
    let message: string = readline.question(">> ");
    return [source_id, target_id, message];
}

function order_hints() {
    console.log('\x1b[32m%s\x1b[0m', "Instructions: ");
    console.log('\x1b[32m%s\x1b[0m', "Enter one of the letters C, P, S, T, Q to give an order.");
    console.log('\x1b[32m%s\x1b[0m', "Please read what entering each of the letters does for you.")
    console.log('\x1b[32m%s\x1b[0m', "C: enter 'C' to continue link state routing operation;");
    console.log('\x1b[32m%s\x1b[0m', "P: enter 'P router_id' to print the routing table of a router, e.g. 'P 1';");
    console.log('\x1b[32m%s\x1b[0m', "S: enter 'S router_id' to shut down a router, e.g. 'S 2'");
    console.log('\x1b[32m%s\x1b[0m', "T: enter 'T router_id' to start a shut router.");
    console.log('\x1b[32m%s\x1b[0m', "D: enter 'D' to send a message.");
    console.log('\x1b[32m%s\x1b[0m', "Q: enter 'Q' to quit the program.");
    console.log('\x1b[32m%s\x1b[0m', "H: enter 'H' to repeat order intruction.");
    console.log('\x1b[32m%s\x1b[0m', "Please note that single quotes are not part of any order.\n\n");
}

function interact_with_users(routers){
    let router_ids: Set<string> = new Set(Object.keys(routers));
    //implement orders given by user
    console.log("Link State Routing operation begins...");
    order_hints();
    let stop = false;
    while (!stop){
        let inputs: Array<string> = prompt_user_for_input(router_ids);
        stop = implement_order(routers, inputs);
    }
     
}

function main(filename: string){
     let routers = initialize_routers(filename);
     interact_with_users(routers);
}
//implement
main('infile1.dat');

//FOR TEST:
//testing functionality
//feed data into routers
//let routers = initialize_routers('infile1.dat');
//check if a router has a pointer to its neighbors.
//console.log("check if router 0 has neighbor router 1");
//console.log(routers[0].neighbors['1'] === routers['1']);

/*testing originate packets*/
//continue_session(routers);
//continue_session(routers);
//continue_session(routers);
//continue_session(routers);

/* testing printing routing table*/
//print_routing_table(routers[5]);
//print_routing_table(routers[0]);
//routers[0].print_routing_table();
//routers[0].originate_packet();
//routers[5].print_routing_table();
//console.log(routers[0].references);


/* testing shutdown function*/
/*
shutdown(routers[2]);
for (let i = 0; i < 10; i++){
    continue_session(routers);
}

//continue_session(routers);
//continue_session(routers);
//console.log();
console.log(routers[1].active_neighbors_in_two_ticks);
console.log(routers[1].print_routing_table());
*/
