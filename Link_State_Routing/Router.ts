import {LSP} from './LSP';
import {Network} from './Network';
import {Node} from './Network';
import { Message } from './Message';
//import { normalize } from 'path';
export class Router {
    readonly id: string; //router id
    readonly network_name: string; //network name behind the current router
    //reference format => id : [network, cost];
    //it is the information sent out along with lsp
    private references: {[id:string]: Array<any>} //router_id: [network, cost]
    private neighbors: {[id: string]: Router}; //this is only for sending packet
    private tick: number; //tick that counts up to two and set back to zero
    private graph: Network; //inner map maintained by the current router
                            // according to what it knows about the whole network.
    private lsp_id: number; //record accumulated sequence_number of sent LSPs by the router.
    private received_packet_sn:{[id: string]: number}; //a bag storing 
                                //sequence numbers of historical packets from each router
    private active_neighbors_in_two_ticks: Set<string>; //a bag containing all routers 
                                //ever sending packet to the router in two ticks.
    private original_references:{[id: string]: Array<any>}; //a backup for references, 
                                //and it is copied back to references when the router is restarted.
    private sd: boolean; //shutdown flag;
    private neighbors_know_i_am_resumed: boolean; //intitially TRUE, FALSE when resumed,
                                        // TRUE again after it originates first packet since resumed.
    private message_id: number; // recored accumulated sequnce_number of sent messages.

    private received_message_sn: {[key: string]: number};//a bag storing 
    //sequence numbers of historical messages passing through the router.
    constructor(id: string, network_name: string){
        this.id = id;
        this.network_name = network_name;
        this.references = {};
        this.neighbors = {};
        this.tick = 0;
        this.graph = new Network(id, network_name);
        this.lsp_id = 0;
        this.received_packet_sn = {};
        this.active_neighbors_in_two_ticks = new Set();
        this.original_references = {};
        this.sd = false;
        this.neighbors_know_i_am_resumed = true;
        this.message_id = 0;
        this.received_message_sn = {};
    }
    //NOT USED, PLEASE IGNORE.
    get_keys_from_references(): Array<string>{
        return Object.keys(this.references);
    }
    //add neighbor router instances to neighbor dictionary, such that this instance can send
    //lsp to its neighbors by calling their receive_packet method.
    add_neighbor(router: Router){
        if (!(router.id in this.neighbors)) {
            this.neighbors[router.id] = router;
        }
    }
    //update reference for neighbors
    add_reference(id: string, cost: number){
        if (!(id in this.references)) { 
            this.references[id] = [null, cost];
            this.original_references[id] = [null, cost];
        }
    }
    //initialize edges in graph, a handle can be used by external function.
    add_graph_edges(from_key: string, to_key: string, cost: number, need_check_existence:boolean = true){
        this.graph.add_edge(from_key, to_key, cost, need_check_existence);
    }
    //need to update neighbors' network names, cost
    private update_references(packet: LSP) {
        let source_key = packet.source_router_id;
        let source_network = packet.network_name;
        let source_references = packet.references;
        this.references[source_key][0] = source_network;
        this.references[source_key][1] = source_references[this.id][1];
    }
    //update graph based on newly received lsp
    private update_graph(packet: LSP) {
        //add in the source information
        let source_key = packet.source_router_id;
        let source_network = packet.network_name;
        let source_references = packet.references;
        //if a source router is first seen by the router
        //initialize a new node in graph for source router
        if (!(source_key in this.graph.V)) {
            let node = new Node(source_key, source_network);
            this.graph.V[source_key] = node;
        } else {
            //update the source router's network_name
            //it is called only when the source router is a neighbor
            this.graph.V[source_key].set_network_name(source_network);
        }
        for (let neighbor_key in source_references) {
            let neighbor_network = source_references[neighbor_key][0];
            let neighbor_cost = source_references[neighbor_key][1];
            if (!(neighbor_key in this.graph.V)) {
                let node = new Node(neighbor_key, neighbor_network);
                this.graph.V[neighbor_key] = node;
            } else {//update network name behind the router
                this.graph.V[neighbor_key].set_network_name(neighbor_network);
            }
            this.graph.add_edge(source_key, neighbor_key, neighbor_cost, false);
        }
        this.graph.find_shortest_path();
    }
    //receive packet
    //discard it if ttl down to zero or received before
    //update reference
    //update graph
    receive_packet(packet: LSP, from: string){
        //decrement ttl (time_to_live)
        //console.log("source:", packet.source_router_id, "; dest:", this.id, "packet id:", packet.sequence_number);
        if (this.sd) {
            return;
        }
        packet.decrement_ttl();
        if (!this.neighbors_know_i_am_resumed) {
            return;
        }
        if (packet.time_to_live != 0) {
            if (!(packet.source_router_id in this.received_packet_sn)) {
                //console.log("recieved.")
                this.read_packet(packet, from);
            } else if (packet.sequence_number > this.received_packet_sn[packet.source_router_id]) {
                this.read_packet(packet, from);
                //console.log("received.");
            }
        }
    }
    //read in packet, update reference, graph, and send it out to neighbors.
    read_packet(packet: LSP, from: string){
        //record current sequence number
        this.received_packet_sn[packet.source_router_id] = packet.sequence_number;
        //add packet sender to `active_neighbors_in_two_ticks`
        if (packet.source_router_id in this.references) { //check if it is a neighbor
            this.active_neighbors_in_two_ticks.add(packet.source_router_id);
            this.update_references(packet);
        }
        //update its graph 
        this.update_graph(packet);
        //send out information
        this.send_out(packet, from);
    }
    //send out packet to all directly connected routers
    //QUESTION: send out received packet in verbatim or need to update something before sending?
    //ANSWER: in verbatim.
    private send_out(packet: LSP, from: string = null){
        for (let key in this.references) {
            if (key != packet.source_router_id && key != from) {
                //add packet to directly connected router
                this.neighbors[key].receive_packet(packet, this.id);
                //console.log("packet is from", this.id, "to ", key);
            }
        }
    }
    //generate_lsp()
    //create a new lsp, in which originator id, network, references to its neighbors is stored.
    private generate_lsp(): LSP {
        this.lsp_id += 1
        return new LSP(this.id, this.network_name, this.lsp_id, this.references);
    }
    //originate packets
    //check if the router receive packets from all neighbors, udpate `active_neighbors_in_two_ticks`
    originate_packet(){
        if (this.sd) {
            return;
        }
        let lsp = this.generate_lsp();
        /* FOR TEST: show what's in packet.
        console.log(this.id, ": reference to send:\n")
        console.log(lsp.network_name);
        console.log(lsp.references);
        console.log(lsp.sequence_number);
        */
        this.tick += 1;
        this.send_out(lsp);
        if (!this.neighbors_know_i_am_resumed) {
            this.neighbors_know_i_am_resumed = true;
        }
        //change this router's cost of links to other routers all to infinity.
        //else discard the packet, do nothing
        if (this.tick >= 2){
            //console.log("get in tick more than 2")
            //check if the router receive packets from all neighbors, 
            //udpate `active_neighbors_in_two_ticks`
            //console.log("check active neighbors:", this.active_neighbors_in_two_ticks);
            for (let neighbor_key in this.references) {
                if (this.active_neighbors_in_two_ticks.has(neighbor_key)){
                    continue;
                }
                //find a shutdown neighbor, change its cost to infinity
                    //in references
                this.references[neighbor_key][1] = Infinity;
                    //in graph
                this.graph.change_neighbor_cost(neighbor_key, Infinity);
            }
            this.graph.find_shortest_path();
            this.active_neighbors_in_two_ticks = new Set();
            this.tick = 0;
        }
    }
    //shut down a router
    shutdown() {
        this.sd = true;
        /* PREVIOUS VERSION: PLEASE IGNORE
        make a copy of current reference, then change all costs in the reference to Infinity.
        if (!this.sd) {
            //this.previous_references = JSON.parse(JSON.stringify(this.references));
        }
        for (let key in this.references) {
            //change cost in references
            this.references[key][1] = Infinity;
            this.graph.change_neighbor_cost(key, Infinity);
        }
        */
        /* testing: show references and the router's neighbors
        console.log("references: ");
        console.log(this.references);
        console.log("neighbors: ");
        for (let key in this.graph.V){
            console.log(this.graph.V[key].get_neighbors());
        }
        */
    }
    //restart the router
    resume() {
        if (this.sd) {
            this.sd = false;
            this.neighbors_know_i_am_resumed = false;
            //WARNING: JSON.stringify does not recognize Infinity, which is converted to null.
            //but it is Ok to use it here.
            this.references = JSON.parse(JSON.stringify(this.original_references));
        }
        /*
        PREVIOUS VERSION:
        in this version, a router's inner reference information on neighbors and graph is changed 
        after it is shut down. However, it is not necessary when the goal of shutdown is only 
        to stop the router from sending or receiving packets. So a boolean switch is added as an 
        replacement of this more complicated method.
        */

        //console.log("previous references is null? ", this.previous_references == null);
        /*
        for (let key in this.references) {
            this.graph.change_neighbor_cost(key, this.references[key][1]);
        }*/
        //testing: show current references
        //console.log(this.references);
    }

    //////////////////////////////////////////////////////////////////
    //THIS PART IS FOR BONUS POINT: SEND A MESSAGE TO A TARGET ROUTER
    //initialize a Message instance to pack up a message to send.
    generate_message(target_id: string, message: string): Message {
        this.message_id += 1;
        return new Message(this.id, target_id, this.network_name, this.message_id, message);
    }
    //send a message to a target router.
    originate_message(target: string, message: string) {
        if (this.sd) {
            return;
        }
        let message_to_send: Message = this.generate_message(target, message);
        this.send_out_message(message_to_send);

    }
    //send out the message to direct neighbors.
    send_out_message(message_to_send: Message, from: string = null){
        for (let key in this.references) {
            if (key != message_to_send.source_router_id && key != from) {
                this.neighbors[key].receive_message(message_to_send, this.id);
            }
        }
    }
    //receive a message
    receive_message(message: Message, from: string) {
        //if shutdown, don't receive anything.
        if (this.sd) {
            return;
        }
        //message can live up to 10 counts
        //decrease count by 1
        message.decrement_ttl();
        if (message.time_to_live != 0) {
            if (!(message.source_router_id in this.received_message_sn)) {
                this.read_message(message, from);
            } else if (message.sequence_number > this.received_message_sn[message.source_router_id]) {
                this.read_message(message, from);
            } 
        } 
    }

    read_message(message: Message, from: string){
        this.received_message_sn[message.source_router_id] = message.sequence_number;
        //target is the current router
        if (message.target_router == this.id) {
            console.log('\x1b[32m%s\x1b[0m', 
            `${this.id} receives an message from ${message.source_router_id}.`);
            console.log('\x1b[32m%s\x1b[0m', 'Message Content:');
            console.log('\x1b[32m%s\x1b[0m', `${message.message}`);
        } else {
            this.send_out_message(message, from);
        }
    }

    //THE PART FOR BONUS POINT END HERE.
    //////////////////////////////////////////////////////////////////

    //print routing table
    print_routing_table(){
        //print out all existing routers, and cost for reaching each of them,
        // and the first router en route to reach each of them.
        // <network_name, first_router>
        // ...
        if (this.sd) {
            console.log("Router",this.id,"has been shut down.");
            console.log("Below is its latest routing table before shutdown.\n");
        }
        this.graph.print_routing_table();
        /* FOR TEST: show neighbors, references, active neighbors, and reference backup.
        console.log("\n");
        //testing: show neighbors in graph
        console.log(this.graph.V[this.id].get_neighbors());
        console.log(this.graph.routing_table);
        //show references
        console.log(this.references);
        //show neighbors successfully sending packet to the router in last two ticks.
        console.log(this.active_neighbors_in_two_ticks);
        //show back references
        console.log(this.original_references);
        //show graph
        //this.print_graph()
        */
    }
    //FOR TEST USE ONLY, PLEASE IGNORE.
    print_graph(){
        for (let key in this.graph.V) {
            console.log(this.graph.V[key]);
        }
        //console.log(this.graph);
    }
}

/*
let's say we have 0 to 6 routers as the example in the instruction. We press 'C' one time, each router sends out one packet, and it is received by all of others. Then, each router understands each other member in the network very well, which can be shown by their complete routing tables at this stage. 


According to the instruction, neighbors need to be re-checked after very two ticks, and tick should be updated after the router originates a packet.
*/
