export class LSP {
    source_router_id: string;
    network_name: string;
    sequence_number: number; //4324 or 342423532 or 1, number?
    time_to_live: number;
    references: {[key:string]:Array<any>}; //TODO list of directly connected routers, or list of network names, and link costs
    
    //TODO: initialize variables
    constructor(id: string, network_name: string, sequence_number: number, information: {[key:string]:Array<any>}){
        this.source_router_id = id;
        this.network_name = network_name;
        this.sequence_number = sequence_number;
        this.time_to_live = 10;
        //TODO: complete the information
        this.references = information;
    }
    decrement_ttl() {
        this.time_to_live -= 1;
    }
}
