class Node {
    private id: string;
    private network_name: string;
    private neighbors: {[key: string]: number};
    
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

    add_edge(from_key: string, to_key: string, cost: number) {
        if (!(from_key in this.V)){
            this.V[from_key] = new Node(from_key);
        }
        if (!(to_key in this.V)) {
            this.V[to_key] = new Node(to_key);
        }
        this.V[from_key].add_neighbor(to_key, cost);
        this.V[to_key].add_neighbor(from_key, cost);
    }
    
    //dijkstra
    find_shortest_path(){
        let source_key = this.source;
        //initialize distances and paths dictionary
        let min_distances: {[key:string]:Array<number>} = {}; //[cumulative_cost, cost_for_comparison]
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
        this.find_shortest_path();
        console.log(this.routing_table);
    }

}

/*
An LSP packet is originated by router 'A', 'A' sends it to 'B', and 'B' sends it to 'C'. When 'C' receives the packet, it is able to see either OPTION 1: network names of 'A' and 'B' and costs, or OPTION 2: directly connected routers of 'A' and 'B' respectively and their corresponding costs. Then 'C' updates its graph by merging received information into its own connectivity graph. So the more packets 'C' receives from different remote routers, the better it knows the whole picture of the router network which it is part of.
*/
