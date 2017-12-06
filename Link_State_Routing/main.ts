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
import * as assert from 'assert';
import {Router} from './Router';
import {Network} from './Network';
import * as readline from 'readline-Sync';

function initialize_routers(filename: string): {[key:string]: Router} {
     //read in data
    let routers:{[key:string]:Router} = {};
    let data: any = fs.readFileSync(filename, 'utf8');
    data = data.split('\n');
    //check if the first line of the file is in valid format.
    //assert.notEqual(data[0].split(/[ ]+/g)[1].search(/\w+\.\w+\.\w+/g), -1, "file format is not valid.");
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
            //temp_router.graph.V[temp_id].add_neighbor(neighbor_id, link_cost);
            temp_router.add_graph_edges(temp_id, neighbor_id, link_cost);
        }
    }
    //add access to neighbor router instances in each router
    //such that it can send packet to neighbors by calling their
    //receive_packet.
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

function print_routing_table(router: Router) {
    router.print_routing_table();
}

function prompt_user_for_input(router_ids:Set<string>): Array<string> {
    let order_symbols = new Set(['P', 'S', 'T']);
    let order: string = readline.question(">> ");
    let inputs: Array<string> = order.trim().split(/[ ]+/g);
    if (inputs.length == 2) {
        if (order_symbols.has(inputs[0])) {
            if (router_ids.has(inputs[1])) {
                return inputs;
            } else {
                console.log('\x1b[31m%s\x1b[0m', `"Error: router ${inputs[1]} does not exist."`);
                console.log(`"Existing routers are ${router_ids}"`);
                console.log("Please enter your order for next operation.");
                return prompt_user_for_input(router_ids);
            }
        } else {
            console.log('\x1b[31m%s\x1b[0m', `"Error: ${inputs[0]} is invalid order symbol."`);
            console.log("Order symbols are 'C', 'P', 'S', 'T', or 'Q'.")
            console.log("Please enter your order for next operation.");
            return prompt_user_for_input(router_ids);
        }
    }else if (inputs.length == 1) {
        if (inputs[0] == 'C' || inputs[0] == 'Q') {
            return inputs;
        } else {
            console.log('\x1b[31m%s\x1b[0m', `"Error: ${inputs[0]} is invalid order symbol."`);
            console.log("Order symbols are 'C', 'P', 'S', 'T', or 'Q'.");
            console.log("Please enter your order for next operation.");
            return prompt_user_for_input(router_ids);
        }
    } else {
        console.log('\x1b[31m%s\x1b[0m', "Error: received more than one argument.");
        console.log("Enter only one argument after your order symbol.");
        console.log("Please enter your order for next operation.");
        return prompt_user_for_input(router_ids);
    }
}

function implement_order(routers:{[key:string]:Router}, order: Array<string>){
    switch(order[0]) {
        //continue
        case ('C'): {
            continue_session(routers);
            break;
        }
        //quit
        case ('Q'): {
            console.log("Program terminated.\nBye.");
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
        //print routing table
        case ('P'): {
            print_routing_table(routers[order[1]]);
            break;
        }
        //default: do nothing and quit
        default: {
            console.log("default order is to do nothing and quit.\nBye.");
            break;
        }
    }
}

function interact_with_users(routers){
    let router_ids: Set<string> = new Set(Object.keys(routers));
     //implement orders by user
     console.log("Link State Routing operation begins...");
     console.log('\x1b[36m%s\x1b[0m', "Instructions: ");
     console.log('\x1b[36m%s\x1b[0m', "Enter one of the letters C, P, S, T, Q to give an order.");
     console.log('\x1b[36m%s\x1b[0m', "Please read what entering each of the letters does for you.")
     console.log('\x1b[36m%s\x1b[0m', "C: enter 'C' to continue link state routing operation;");
     console.log('\x1b[36m%s\x1b[0m', "P: enter 'P router_id' to print the routing table of a router, e.g. 'P 1';");
     console.log('\x1b[36m%s\x1b[0m', "S: enter 'S router_id' to shut down a router, e.g. 'S 2'");
     console.log('\x1b[36m%s\x1b[0m', "T: enter 'T router_id' to start a shut router.");
     console.log('\x1b[36m%s\x1b[0m', "Q: enter 'Q' to quit the program.");
     console.log('\x1b[36m%s\x1b[0m', "Please note that single quotes are not part of any order.\n");
     console.log('\x1b[32m%s\x1b[0m', `"Existing router ids are ${router_ids}\n"`)
     console.log("Please enter your order for next operation.");
     let inputs: Array<string> = prompt_user_for_input(router_ids);
     implement_order(routers, inputs);
}

function main(filename: string){
     let routers = initialize_routers(filename);
     interact_with_users(routers);
}
//implement
main('infile.dat');