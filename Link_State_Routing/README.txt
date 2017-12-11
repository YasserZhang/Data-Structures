
Author: Ning Zhang
ID No: 10431028

This is an complement to comments in my code. The main goal for this file is to give you 
an idea of the program structure from a high level.

Files Structure:

Message.ts  the class generating instance of message to be sent to a target router. (extra work FOR BONUS)

            a message includes:
                    source_router_id,
                    network_name,
                    message sequence number,
                    TTL,
                    message content,
                    target router id.

LSP.ts      the class generating instances of link state packet.

            a link state packet includes: 
                    router_id, 
                    network_name,
                    packet sequence number, 
                    TTL,
                    referential information about the router's directly 
                    connected neighbor routers in the format of 
                    <router_id: [network_name, cost]>.

Network.ts  has two classes: Node and Network.

            Node: a factory creating instances of vertices in Network class.

            Network: a factory generating an instance for each router as its inner attribute
            named "graph", the router uses the graph to maintain a map to reflect its own 
            understanding of the real network map. 

            Functions:

                'find_shortest_path()'  implements Dijkstra Algorithm to create 
                routing table.

                'print_routing_table()' print <network_name, outgoing_link>

Router.ts   the class generating instances of routers.

            Functions:

            'originate_message()'     generate message, accepts target id and message content as inputs,
                                    send message to direct neighbors.

            'receive_message()'       a router receives a number, decrement TTL by 1, and see if it is 
                                    the target router of the message, if yes, print message; if not, 
                                    relay the message to direct neighbors. Receiving rules are similar
                                    to those of LSP packets.

            'originate_packet()'    generate packet, and ticks, check non-responding neighbors, 
                                    if `neighbors_know_i_am_resumed` is 'FALSE', change to 'TRUE';

            'receive_packet()'      receive packet, update referentail information, update graph, 
                                    and relay the packet to neighbors;

            'shutdown()'            shut down the router. change router attribute 'sd' to 'TRUE'; 
                                    back up 'references'; When 'sd' is 'TRUE', the router 
                                    neither receives or sends packets.

            'resume()'              change 'sd' back to 'FALSE'; change `neighbors_know_i_am_resumed`
                                    to 'FALSE'; When `neighbors_know_i_am_resumed` is 'FALSE', the 
                                    router receives packets, but discards them.

            'print_routing_table()' call 'print_routing_table()' within the graph of a router.


main.ts     functions that build an interfance for users. call it to start the program. 

            Funcitons:

                'initialize_routers()'   reads in 'infile.dat', and inititalizes routers, keeping them 
                in an object named "routers" in the format of <outer_id : Router>.

                'interact_with_users()'  reads in "routers", prints out order instructions and available 
                router ids, and prompts the user for next operation.

                'main()'                 wrap up the two functions above, and accepts an string argument;
                                         the argument should be a file name, such as 'infile.dat'; 
                                         If you need to use your own test file, please set the filename as 
                                         this function's input. Two input files are prepared with this 
                                         assignment, 'infile1.data' and 'infile2.data';

            Use Cases:
                All cases are processed within 'interact_with_users()'.
                When User Press
                    "C": iterate through "routers", call 'originate_packet()' in each router;
                    "P router_id": call 'print_routing_table()' in the router toprint routing table in the format of <network_name    outgoing_link>, 
                                   the outgoing_link of an unreachable router is set to be "null";
                    "S router_id": call 'shutdown()' in the router instance;
                    "T router_id": call 'resume()' in the router instance;
                    "D"            (FOR BONUS) call 'ask_for_message()' function to ask further information about 
                                       source router id, target router id, and message content; then 
                                       call the source router's 'originate_message()' to send message.
                    "H":           print instruction of orders;
                    "Q":           quit the program by doing nothing.


Some Features Worth To Mention:

Sometimes mutual infinite cost link between two neighbors may happen and cannot be recovered any more.
This happens when a router is resumed, but its recovered referential information about its neighbors is 
overwritten by the old information it receives from its neighbors. Its neighbors, which have not received 
any new information from the newly resumed router, still assume the router is shut down, recording its cost
as INFINITY. 

To avoid this incident, I add a boolean flag in the Router Class, it is named as 'neighbors_know_i_am_resumed'.
For a router, it should know its own relation to neighbors better than any other router. So my goal is to stop 
the newly resumed router from receiving any outside information before it sends out its news. More 
specifically, I initially set the 'neighbors_know_i_am_resumed' as 'TRUE'. When a router is shut down and 
re-started, 'neighbors_know_i_am_resumed' is changed to 'FALSE'. when 'FALSE', it discards received packets. 
And it keeps being 'FALSE' until it sends out its own packet, updating other routers' understaning of it.

This method successfully prevents mutual infinite cost link between two neighbors. And even when a 
blackout happens, i.e. all routers are shut down, the networks can recover back to normal.


Some example outputs:

Print Routing Table:

>> P 5
 network     outgoing link
155.246.80         2
155.246.81         2
155.246.82         2
155.246.83         2
155.246.84         4
155.246.86         6



Send a message from router 1 to router 5.

>> D
Existing router ids are 0 1 2 3 4 5 6.
Enter source router id:
>> 1

Existing router ids are 0 1 2 3 4 5 6.
Enter target router id:
>> 5

Enter the message content:
>> hello, this is from router 1.

5 receives an message from 1.
Message Content:
hello, this is from router 1.



Print Routing Table where some routers are shut down or isolated.
>> P 2
 network     outgoing link
155.246.80         1
155.246.81         1
155.246.83         null
155.246.84         1
155.246.85         null
155.246.86         null
