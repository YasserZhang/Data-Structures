import * as fs from 'fs';
export class Node {
    private readonly id: string;
    private network_name: string;
    private neighbors: {[key: string]: number};
    
    constructor(key: string, network_name: string = null) {
        this.id = key;
        this.network_name = network_name;
        this.neighbors = {};
    }
    add_neighbor(node_key: string, dist: number) {
        if (!(node_key in this.neighbors)) {
            this.neighbors[node_key] = dist;
        }
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
}

export class Network {
    //routers: {[key: string]: Node};
    V: {[key: string]: Node}
    source: string;
    routing_table: Array<Array<any>>;

    constructor(key: string, network_name: string){
        this.V = {};
        this.source = key;
        this.V[this.source] = new Node(key, network_name);
        this.routing_table = [];
    };
    /*
    //testing the functionality of dijkstra
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
    //testing code END
    */
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
                min_paths[key] = 'infinity';
            } else {
                min_distances[key] = [0, 0];
                min_paths[key] = key;
            }
        }
        //not_visited: a set of node keys whose distances to source are not minimum
        let not_visited: Set<string> = new Set(Object.keys(this.V));
        //console.log("not visited: ",not_visited);
        not_visited.delete(source_key);
        //visited: when a node with min distance to source is found, add it here and 
        //delete it from not_visited
        let visited: Array<string> = [source_key];
        let visited_hash = new Set(visited);
        while (not_visited.size != 0) {
            source_key = visited[visited.length - 1];
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
            not_visited.delete(min_node_key);
            visited.push(min_node_key);
        }
        this.routing_table = [];
        for (let key in min_distances) {
            if (key != this.source) {
                let network_id: string = key;
                let cost: number = min_distances[key][1];
                let path: string = min_paths[key];
                let outgoing_link: string = path[1];
                let s = [network_id, cost, outgoing_link];
                this.routing_table.push(s);
            }
        }
    }
    //print routing table
    print_routing_table(){
        //this.find_shortest_path();
        console.log(this.routing_table);
    }
} //end Network


/* test the functionality of dijkstra
let dj = new Network('1', '123.234.786');
dj.load_data('infile.dat');
dj.find_shortest_path();
dj.print_routing_table();
*/
