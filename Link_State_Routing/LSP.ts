//class of packet
export class LSP {
    source_router_id: string; // originating router's id
    network_name: string; // network behind the router
    sequence_number: number; // the packet's sequence number //4324 or 342423532 or 1, number? A: accumulative positive integers
    time_to_live: number; // TTL: initialized at 10, counting down to 0
    references: {[key:string]:Array<any>}; //list of directly connected routers, format => id: [network, cost]
    //initialize variables
    constructor(id: string, network_name: string, sequence_number: number, information: {[key:string]:Array<any>}){
        this.source_router_id = id;
        this.network_name = network_name;
        this.sequence_number = sequence_number; // accumulative positive integers
        this.time_to_live = 10; // TTL: initialized at 10, counting down to 0
        //complete the information
        this.references = information; // id: [network, cost]
    }
    //decrease by 1
    decrement_ttl() {
        this.time_to_live -= 1;
    }
}
