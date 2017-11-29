export class LSP {
    id: string;
    sequence_number: number; //4324 or 342423532 or 1, number?
    time_to_live: number;
    references: {[key:string]:number}; //TODO list of directly connected routers, or list of network names, and link costs
    
    //TODO: initialize variables
    constructor(id: string, sequence_number: number, information: {[key:string]:number}){
        this.id = id;
        this.sequence_number = sequence_number;
        this.time_to_live = 10;
        //TODO: complete the information
        this.references = information;
    }
    //TODO: read in information.
    read_information(){

    }

    //TODO: create a packet
    create_packet(){

    }
    //TODO: if already have a packet, then next time just update all information for next packet.
    //sequence_number, time_to_live, information;
    update_packet(){
        this.sequence_number += 1;
        this.time_to_live = 10;
    }

}
