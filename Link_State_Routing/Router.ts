import {LSP} from './LSP';
import {Network} from './Network';
import {Node} from './Network';
//import { normalize } from 'path';
export class Router {
    readonly id: string; //router id
    readonly network_name: string; //network name behind the current router
    //reference format => id : [network, cost];
    //it is the information sent out along with lsp
    private references: {[id:string]: Array<any>} //router_id: [network, cost, resumed_times]
    private neighbors: {[id: string]: Router}; //this is only for sending packet
    private tick: number; //tick that counts up to two and set back to zero
    private graph: Network; //inner map maintained by the current router according to what it knows about the whole network.
    private lsp_id: number; //record accumulated sequence_number of sent LSPs by the router.
    //private received_packets: Array<LSP>;//packet receiver it should be a queue, need to send them out one by one
    private received_packet_sn:{[id: number]: number}; //a bag storing
                            // sequence numbers of historical packets from each router
    private active_neighbors_in_two_ticks: Set<string>; //a bag containing all routers ever sending packet to the router in two ticks.
    private original_references:{[id: string]: Array<any>}; //a backup for references, and it is copied back to references when the router is restarted.
    private sd: boolean; //shutdown flag;
    private resumed_times: number; // record number of times the router has ever been shut down and resumed.
    //private other_routers_resumed_times: {[id: string]: number}; // keep a record on resumes times of each router in network except itself.
    constructor(id: string, network_name: string){
        this.id = id;
        this.network_name = network_name;
        this.references = {};
        this.neighbors = {};
        this.tick = 0;
        this.graph = new Network(id, network_name);
        this.lsp_id = 0;
        //this.received_packets = [];
        this.received_packet_sn = {};
        this.active_neighbors_in_two_ticks = new Set();
        this.original_references = {};
        this.sd = false;
        this.resumed_times = 0;
        //this.other_routers_resumed_times = {};
        this.neighbors_know_i_am_resumed = true;
    }
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
    add_reference(id: string, cost: number, resumed_times: number){
        if (!(id in this.references)) { 
            this.references[id] = [null, cost, resumed_times];
            this.original_references[id] = [null, cost, resumed_times];
            //this.other_routers_resumed_times[id] = resumed_times;
        }
    }
    add_graph_edges(from_key: string, to_key: string, cost: number, need_check_existence:boolean = true){
        this.graph.add_edge(from_key, to_key, cost, need_check_existence);
    }
    //need to update neighbors' network names, cost, resumed_times
    private update_references(packet: LSP): boolean{
        let source_key = packet.source_router_id;
        let source_network = packet.network_name;
        let source_references = packet.references;
        if (source_references[this.id][2] >= this.references[source_key][2]) {
            this.references[source_key][0] = source_network;
            this.references[source_key][1] = source_references[this.id][1];
            this.references[source_key][2] = source_references[this.id][2];
            //this.other_routers_resumed_times[source_key] = source_references[this.id][2];
            return true;
        }
        return false;
    }
    //update graph based on newly received lsp
    private update_graph(packet: LSP) {
        //add in the source information
        let source_key = packet.source_router_id;
        let source_network = packet.network_name;
        let source_references = packet.references;
        //if a source router is first seen by the router
        //initialize a new node in graph for source router
        //if (!(source_key in this.other_routers_resumed_times)) {
        //    this.other_routers_resumed_times[source_key] = 0;
        //}
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
            //if (!(neighbor_key in this.other_routers_resumed_times) && neighbor_key != this.id) {
            //    this.other_routers_resumed_times[neighbor_key] = 0;
            //}
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
    receive_packet(packet: LSP){
        //decrement ttl (time_to_live)
        //console.log("source:", packet.source_router_id, "; dest:", this.id, "packet id:", packet.sequence_number);
        if (this.sd) {
            return;
        }
        packet.decrement_ttl();
        if (packet.time_to_live != 0) {
            if (!(packet.source_router_id in this.received_packet_sn)) {
                //console.log("recieved.")
                this.read_packet(packet);
            } else if (packet.sequence_number > this.received_packet_sn[packet.source_router_id]) {
                this.read_packet(packet);
                //console.log("received.");
            }
        }
    }
    //read in packet, update reference, graph, and send it out to neighbors.
    read_packet(packet: LSP){
        //record current sequence number
        this.received_packet_sn[packet.source_router_id] = packet.sequence_number;
        //add packet sender to `active_neighbors_in_two_ticks`
        if (packet.source_router_id in this.references) { //check if it is a neighbor
            this.active_neighbors_in_two_ticks.add(packet.source_router_id);
            //update network names of neighbors
            let updated: boolean = this.update_references(packet);
            if (!updated) {
                return;
            }
        }
        //update its graph 
        this.update_graph(packet);
        //send out information
        this.send_out(packet);
    }
    //send out packet to all directly connected routers
    //QUESTION: send out received packet in verbatim or need to update something before sending?
    //ANSWER: in verbatim.
    private send_out(packet: LSP){
        for (let key in this.references) {
            if (key != packet.source_router_id) {// && this.references[key][1] != Infinity
                //add packet to directly connected router
                this.neighbors[key].receive_packet(packet);
            } else {
                //console.log("The packet is not sent from ", this.id, "to", key);
            }
        }
    }
    //FIRST VERSION OF generate_lsp()
    //create a new lsp, in which originator id, network, references to its neighbors is stored.
    private generate_lsp(source_router_id: string, network_name: string, sequence_number: number, references: {[key:string]:Array<any>}): LSP{
        this.lsp_id += 1
        return new LSP(source_router_id, network_name, sequence_number, references);
    }
    /*
    //SECOND VERSION OF generate_lsp()
    private generate_lsp(): LSP {
        this.lsp_id += 1
        let references_to_send: {[key: string]: any[]} = {};
        //let references_to_send = JSON.parse(JSON.stringify(this.references));
        for (let key in this.references) {
            references_to_send[key] = [];
            references_to_send[key].push(this.references[key][0]);
            references_to_send[key].push(this.references[key][1]);
            references_to_send[key].push(this.resumed_times);
        }
        return new LSP(this.id, this.network_name, this.lsp_id, references_to_send);
    }
    */
    
    //originate packets
    //check if the router receive packets from all neighbors, udpate `active_neighbors_in_two_ticks`
    originate_packet(){
        if (this.sd) {
            return;
        }
        //this.lsp_id += 1;
        let lsp = this.generate_lsp(this.id, this.network_name, this.lsp_id, this.references);
        //let lsp = this.generate_lsp();
        console.log(this.id, ": reference to send:\n")
        console.log(lsp.references);
        console.log(lsp.sequence_number);
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
                //and in graph
                this.graph.change_neighbor_cost(neighbor_key, Infinity);
            }
            this.graph.find_shortest_path();
            this.active_neighbors_in_two_ticks = new Set();
            this.tick = 1;
            //console.log("check active neighbors updated:", this.active_neighbors_in_two_ticks);
        }
    }
    //shut down a router
    //update references to Infinity
    //update edges in graph
    shutdown() {
        this.sd = true;
        /* PREVIOUS VERSION:
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
            this.resumed_times += 1;
            //WARNING: JSON.stringify does not recognize Infinity, which is converted to null.
            //but it is Ok to use it here.
            this.references = JSON.parse(JSON.stringify(this.original_references));
            for(let key in this.references) {
                this.references[key][2] = this.resumed_times;
            }
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
        if (this.previous_references != null) {
            this.references = JSON.parse(JSON.stringify(this.previous_references));
            this.resumed_times += 1;
        }*/
        /*
        for (let key in this.references) {
            this.graph.change_neighbor_cost(key, this.references[key][1]);
        }*/
        //testing: show current references
        //console.log(this.references);
    }
    //print routing table
    print_routing_table(){
        //print out all existing routers, and cost for reaching each of them,
        // and the first router en route to reach each of them.
        // <network_name, cost, first_router>
        // ...
        if (this.sd) {
            console.log("Router",this.id,"has been shut down.");
            console.log("Below is its latest routing table before shutdown.\n");
        }
        this.graph.print_routing_table();
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
    }
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
