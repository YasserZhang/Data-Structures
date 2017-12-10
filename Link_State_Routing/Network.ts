import * as fs from 'fs';

export class Node {
    private readonly id: string; // router id
    private network_name: string; // network behind the router
    private neighbors: {[key: string]: number}; // the router's neighbors and costs
    
    constructor(key: string, network_name: string = null) {
        this.id = key;
        this.network_name = network_name;
        this.neighbors = {};
    }
    add_neighbor(node_key: string, dist: number) {
        this.neighbors[node_key] = dist;
    }
    get_network_name() {
        return this.network_name;
    }
    set_network_name(name:string) {
        if (this.network_name == null){
            this.network_name = name;
        }
    }
    get_neighbors() {
        return this.neighbors;
    }
    get_key() {
        return this.id;
    }
    // this function is used when a graph has more than one component.
    // in this case, a router in a different component will be picked as 
    // next closed destination in dijkstra algorithm, and the router's 
    // neighbor with the minimum distance, or say cost, will be chosen
    // as the outgoing link.

    // returns: the router id of the neighbor with minimum distance to the source router.
    get_neighbor_with_min_cost(): string{
        //credit to https://stackoverflow.com/questions/27376295/getting-key-with-the-highest-value-from-object
        //return Object.keys(this.neighbors).reduce(function(a,b){return this.neighbors[a] < this.neighbors[b] ? a : b});
        let min_key: string = null;
        let min_cost: number = Infinity;
        for (let key in this.neighbors) {
            if (this.neighbors[key] < min_cost) {
                min_cost = this.neighbors[key];
                min_key = key;
            }
        }
        return min_key;
    }
}

export class Network {
    //routers: {[key: string]: Node};
    V: {[key: string]: Node} // vertices, format => id: Node;
    source: string; // source id of the source router
    routing_table: Array<Array<any>>; //for final printing

    constructor(key: string, network_name: string){
        this.V = {};
        this.source = key;
        this.V[this.source] = new Node(key, network_name);
        this.routing_table = [];
    };
    /*
    //TESTING: functionality of dijkstra
    //testing code START here
    load_data(filename: string) {
        //this.min_distances = {};
        //this.min_paths = {};
        let data = fs.readFileSync(filename, 'utf8');
        let arrs = data.split('\n');
        for (let arr of arrs) {
            arr = arr.trim();
            let row: Array<string> = arr.split(' ');
            //console.log(row);
            let from_key: string = row[0];
            let to_key: string = row[1];
            let dist: number = Number(row[2]);
            this.add_edge(from_key, to_key, dist)
        }
        //console.log(Object.keys(this.V));
    }
    //testing code END here
    */
    //add undirected edges to two connecting routers
    add_edge(from_key: string, to_key: string, cost: number, need_check_existence: boolean = true) {
        if (need_check_existence) {
            if (!(from_key in this.V)){
                this.V[from_key] = new Node(from_key);
            }
            if (!(to_key in this.V)) {
                this.V[to_key] = new Node(to_key);
            }
        }
        this.V[from_key].add_neighbor(to_key, cost);
        this.V[to_key].add_neighbor(from_key, cost);
    }
    //reset mutual cost btw a neighbor and the router
    change_neighbor_cost(neighbor_key: string, cost: number){
        this.V[this.source].get_neighbors()[neighbor_key] = cost;
        this.V[neighbor_key].get_neighbors()[this.source] = cost;
    }
    //dijkstra
    find_shortest_path(){
        let source_key = this.source;
        //initialize distances and paths dictionary
        //Array<number> => [cumulative_cost, cost_for_comparison]
        let min_distances: {[key:string]:Array<number>} = {}; 
        let min_paths: {[key:string]:string} = {};
        for (let key in this.V) {
            if (key != source_key){
                min_distances[key] = [0, Infinity];
                min_paths[key] = 'inf';
            } else {
                min_distances[key] = [0, 0];
                min_paths[key] = key;
            }
        }
        //not_visited: a set of node keys whose distances to source are not minimum
        let not_visited: Set<string> = new Set(Object.keys(this.V));
        //console.log("original not visited:", not_visited);
        //console.log("not visited: ",not_visited);
        not_visited.delete(source_key);
        //visited: when a node with min distance to source is found, add it here and 
        //delete it from not_visited
        let visited: Array<string> = [source_key];
        let visited_hash = new Set(visited);
        while (not_visited.size != 0) {
            source_key = visited[visited.length - 1];
            //if (this.V[source_key]){ //DEBUG: null keys are added to the visited array.
            let neighbors = this.V[source_key].get_neighbors();
            let min_distance = Infinity;
            let min_node_key = null;

            for (let node_key of not_visited) {
                if (!(node_key in visited_hash)) {
                    if (node_key in neighbors) {
                        let distance = neighbors[node_key];
                        //compare it to its previous distance to source
                        let temp_dist = min_distances[source_key][1] + distance;
                        if (min_distances[node_key][1] > temp_dist) {
                            min_distances[node_key][1] = temp_dist;
                            min_paths[node_key] = min_paths[source_key] + node_key;
                        }
                    } 
                    //compare it to local minimum
                    if (min_distance > min_distances[node_key][1]) {
                        min_distance = min_distances[node_key][1];
                        min_node_key = node_key;
                    }
                }
            }
            //check if next router with min distance
            if (min_node_key != null) {
                not_visited.delete(min_node_key);
                visited.push(min_node_key);
            } else {
                //it means source node has inifinity cost to all the nodes in the not_visited list.
                for (let node of not_visited) {
                    not_visited.delete(node);
                    visited.push(node);
                }
            }
            /*
            //DEBUG: null keys are added to the visited array.
            // it is due to the fact that the graph may have more than one components.
            
            }//end if
            else {
                console.log("undefined key:", source_key, "graph:", this.V);
                //not_visited.delete(source_key);
                console.log(not_visited);
                console.log(visited);
                break;
            }
            */
        }
        //update results to routing table
        this.routing_table = [];
        for (let key in min_distances) {
            if (key != this.source) {
                let network: string = this.V[key].get_network_name();
                if (network == null) {
                    network = 'unknown behind ' + key;
                }
                //let network_id: string = key;
                let cost: number = min_distances[key][1];
                let path: string = min_paths[key];
                if (path == 'inf'){
                    var outgoing_link: string = null; //this.V[this.source].get_neighbor_with_min_cost();
                } else {
                    var outgoing_link: string = path[1];
                }
                let s = [network, cost, outgoing_link];
                this.routing_table.push(s);
            }
        }
    }
    //print routing table
    print_routing_table(){
        this.find_shortest_path();
        //TODO: make it more readable.
        console.log(" network     outgoing link      cost");
        for (let item of this.routing_table) {
            console.log(item[0], "       ", item[2], "           ", item[1]);
        }
        //console.log(this.routing_table);
    }
} //end Network


/* TEST: functionality of dijkstra
let dj = new Network('1', '123.234.786');
dj.load_data('infile.dat');
dj.find_shortest_path();
dj.print_routing_table();
*/
