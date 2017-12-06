import {LSP} from './LSP';
import {Network} from 'Network';
import {Node} from 'Network';
//import { normalize } from 'path';
export class Router {
    readonly id: string; //router id
    readonly network_name: string; //network name behind the current router
    //reference format => id : [network, cost];
    //it is the information sent out along with lsp
    private references: {[id:string]: Array<any>} 
    private neighbors: {[id: string]: Router}; //this is only for sending packet
    private tick: number; //tick that counts up to two and set back to zero
    private graph: Network; //inner map maintained by the current router according to what it knows about the whole network.
    private lsp_id: number; //record accumulated sequence_number of sent LSPs by the router.
    //private received_packets: Array<LSP>;//packet receiver it should be a queue, need to send them out one by one
    private received_packet_sn:{[id: number]: number}; //a bag storing
                            // sequence numbers of historical packets from each router
    private active_neighbors_in_two_ticks: Set<string>;
    private previous_references:{[id: string]: Array<any>};
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
        this.previous_references = null;
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
    add_reference(id: string, cost: number){
        if (!(id in this.references)) {
            this.references[id] = [null, cost];
        }
    }
    add_graph_edges(from_key: string, to_key: string, cost: number, need_check_existence:boolean = true){
        this.graph.add_edge(from_key, to_key, cost, need_check_existence);
    }
    //need to update neighbors' network names
    private update_references(packet: LSP){
        let source_key = packet.source_router_id;
        let source_network = packet.network_name;
        if (source_key in this.references && this.references[source_key][0] == null) {
            this.references[source_key][0] = source_network;
        }
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
            //update graph by adding undirected edges btw source router and its neighbors
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
        packet.decrement_ttl(); 
        if (packet.time_to_live != 0 && 
                packet.sequence_number > this.received_packet_sn[packet.source_router_id]){
            //add packet sender to `active_neighbors_in_two_ticks`
            this.active_neighbors_in_two_ticks.add(packet.source_router_id);
            //record current sequence number
            this.received_packet_sn[packet.source_router_id] = packet.sequence_number;
            //update network names of neighbors
            this.update_references(packet);
            //update its graph 
            this.update_graph(packet);
            //send out information
            this.send_out(packet);
        }
    }
    //send out packet to all directly connected routers
    //QUESTION: send out received packet in verbatim or need to update something before sending?
    //ANSWER: in verbatim.
    private send_out(packet: LSP){
        for (let key in this.references) {
            if (key != packet.source_router_id && this.references[key][1] != Infinity) {
                //add packet to directly connected router
                this.neighbors[key].receive_packet(packet);
            }
        }
    }
    //create a new lsp, in which originator id, network, references to its neighbors is stored.
    private generate_lsp(source_router_id: string, network_name: string, sequence_number: number, references: {[key:string]:Array<any>}): LSP{
        return new LSP(source_router_id, network_name, sequence_number, references);
    }
    //originate packets
    //check if the router receive packets from all neighbors, udpate `active_neighbors_in_two_ticks`
    originate_packet(){
        this.lsp_id += 1;
        let lsp = this.generate_lsp(this.id, this.network_name, this.lsp_id, this.references);
        this.send_out(lsp);
        //change this router's cost of links to other routers all to infinity.
        //else discard the packet, do nothing
        if (this.tick >= 2){
            //check if the router receive packets from all neighbors, 
            //udpate `active_neighbors_in_two_ticks`
            for (let neighbor_key in this.references) {
                if (this.active_neighbors_in_two_ticks.has(neighbor_key)){
                    continue;
                }
                //find a shutdown neighbor, change its cost to infinity
                //in reference
                this.references[neighbor_key][1] = Infinity;
                //and in graph
                this.graph.change_neighbor_cost(neighbor_key, Infinity);
            }
            this.active_neighbors_in_two_ticks = new Set();
            this.tick = 0;
        } else{
            this.tick += 1;
        }
    }
    //shut down a router
    //update references to Infinity
    //update edges in graph
    shutdown(){
        this.previous_references = JSON.parse(JSON.stringify(this.references));
        for (let key in this.references) {
            //change cost in references
            this.references[key][1] = Infinity;
            this.graph.change_neighbor_cost(key, Infinity);
        }
    }
    //restart the router
    resume(){
        if (this.previous_references != null) {
            this.references = JSON.parse(JSON.stringify(this.previous_references));
        }
        for (let key in this.references) {
            this.graph.change_neighbor_cost(key, this.references[key][1]);
        }
    }
    //print routing table
    print_routing_table(){
        //print out all existing routers, and cost for reaching each of them,
        // and the first router en route to reach each of them.
        // <network_name, cost, first_router>
        // ...
        this.graph.print_routing_table();
    }
}