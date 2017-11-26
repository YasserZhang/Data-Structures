class LSP {
    id: number;
    sequence_number: number; //4324 or 342423532 or 1, number?
    time_to_live: number;
    information: string[]; //TODO list of directly connected routers, or list of network names, and link costs
    
    //TODO: initialize variables
    constructor(){

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
        
    }

}
