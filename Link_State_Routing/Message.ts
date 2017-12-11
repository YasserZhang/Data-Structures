//class of message //FOR BONUS
export class Message {
    source_router_id: string; //originator
    network_name: string;
    sequence_number: number; //message id
    time_to_live: number; // TTL: initialized at 10, counting down to 0
    message: string // to store message content.
    target_router: string; // target id;
    constructor(source_id: string, target_id: string, network_name: string, sequence_number: number, message:string) {
        this.source_router_id = source_id;
        this.network_name = network_name;
        this.sequence_number = sequence_number;
        this.time_to_live = 10;
        this.message = message; //message to send out.
        this.target_router = target_id;
    }
    //decrease by 1
    decrement_ttl() {
        this.time_to_live -= 1;
    }
}
