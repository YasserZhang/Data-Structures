/**
 * Group Member: Ning Zhang (10431028) 
 *
 * plans
 * create two heaps for input frequency table
 * 		frequency_heap: a max heap
 *  	min_heap: a min heap
 * 	two heaps store instaces of TreeNode class
 * 	because of the charateristics of reference typse, 
 * 	when an instance in one heap is updated, its shallow copy in the other is updated as well.
 * Using this feature, huffman tree is created using DFS method.
 * Then output results using deque method in heap, 
 * 		frequency heap outputs frequency table;
 *  	min heap outputs huffman code table.
 *  	corresponding output file is written into file.
 * 
 * 
 */

import * as fs from 'fs';
import * as readline from 'readline-Sync';
import * as assert from 'assert';
import {PriorityQueue} from './PriorityQueue';

class TreeNode {
	name: string;
	val: number;
	label: number;
	parent: TreeNode;
	left: TreeNode;
	right: TreeNode;
	code: string;
	constructor(name, val) {
		this.name = name || null;
		this.val = val || null;
		this.parent = null;
		this.left = null;
		this.right = null;
		this.label = null;
		this.code = null;
	}
}

class HuffmanEncode {
    private data: string;
	private frequency_queue: PriorityQueue<TreeNode>;
	private min_queue: PriorityQueue<TreeNode>;
	merged_node: TreeNode;

	constructor(){
		this.data = null;
	}

	//load in raw data
	private load_data(filename){
		//validaty of filename has been checked when prompting user for input.
		//load in data from file
		this.data = fs.readFileSync(filename, 'utf8');
		//clean non-alphanumerical characters
		this.data = this.data.replace(/[^A-Za-z0-9]/g, '');
	}

	//count ferquency of each characters in the cleaned data;
	//create a hashmap to store the reuslt
	private process_data(){
		//create frequency table and create forest
		assert.notEqual(this.data, null, "Error: no data!");
		let table: Object = {};
		for (let i = 0; i < this.data.length; i++) {
			if(this.data[i] in table){
				table[this.data[i]]++;
			}else {
				table[this.data[i]] = 1;
			}
			
		}
		//initialize frequency heap and min heap
		this.frequency_queue = new PriorityQueue<TreeNode>((x, y) => x.val - y.val); //max heap
		this.min_queue = new PriorityQueue<TreeNode>((x, y) => y.val - x.val); //min heap

		for (var key in table) {
			//create leaf nodes and push into the frequency heap and min heap
			let leaf: TreeNode = new TreeNode(key, table[key]);
			this.frequency_queue.enqueue(leaf);
			this.min_queue.enqueue(leaf);
		}
	}

	//merge forests into one parent TreeNode, assign it to this.merged_node
	private merge() {
		//output: a single tree node
		while (true) {
			let first_poll: TreeNode = this.min_queue.dequeue();
			let second_poll: TreeNode = this.min_queue.dequeue();
			let parent_name: string = first_poll.name + '-' + second_poll.name;
			let parent_val: number = first_poll.val + second_poll.val;
			let new_parent: TreeNode = new TreeNode(parent_name, parent_val);
			new_parent.left = first_poll;
			first_poll.parent = new_parent;
			new_parent.right = second_poll;
			second_poll.parent = new_parent;
			if (this.min_queue.empty()) {
				this.merged_node = new_parent;
				this.merged_node.label = null;
				this.merged_node.code = '';
				return;
			}
			this.min_queue.enqueue(new_parent)
		}
	}

	//Use DFS to label and encode all nodes
	//recursion
	private dfs(parent: TreeNode) {
		//base case
		if (parent.left === null && parent.right === null){
			return;
		}
		if (parent.left != null) {
			parent.left.label = 0;
			parent.left.code = parent.code + '0';
			this.dfs(parent.left);
		}
		if (parent.right != null) {
			parent.right.label = 0;
			parent.right.code = parent.code + '1';
			this.dfs(parent.right);
		}
	}

	//implement huffman encoding using DFS method
	private encode() {
		this.dfs(this.merged_node);
	}

	//print out frequency table. but not used in this homework.
	private print() {
		console.log(this.frequency_queue.get_queue());
	}

	//generate padding spaces for alignment purpose in the output.
	private repeat_padding_space(num:number): string {
		let space = ' ';
		for(let i = 1; i < num; i++){
			space = space + ' ';
		}
		return space;
	}

	//print frequency table
	private output_frequency_table(node: TreeNode): string {
		let freq_perc: any = ((node.val / this.data.length) * 100).toFixed(3).toString();
		let space: string = this.repeat_padding_space(10 - freq_perc.length + 1);
		let result: string = node.name + ','+ space + freq_perc + "%";
		return result;
	}

	//print huffman code table
	private output_huffman_code(node: TreeNode): string {
		let code: string = node.code;
		let space: string = this.repeat_padding_space(10);
		let result: string = node.name + ','+ space + code;
		return result;
	}

	//write into the output.dat
	private output(filename) {
		let frequency_table_output: string[] = [];
		let huffman_code_output: string[] = [];
		let total_count: number = 0;
		while(!this.frequency_queue.empty()) {
			let node: TreeNode = this.frequency_queue.dequeue();
			total_count = total_count + node.code.length * node.val;
			let frequency: string = this.output_frequency_table(node);
			let huffman_code: string = this.output_huffman_code(node);
			frequency_table_output.push(frequency);
			huffman_code_output.push(huffman_code);
		}
		fs.writeFileSync(filename, 'Symbol' + this.repeat_padding_space(5) + "Frequency\n");
		for(let freq of frequency_table_output) {
			fs.appendFileSync(filename, freq + '\n');
			console.log(freq);
		}
		fs.appendFileSync(filename, '\n\nSymbol' + this.repeat_padding_space(5) + "Huffman Codes\n");
		for (let code of huffman_code_output) {
			fs.appendFileSync(filename, code + '\n');
			console.log(code);
		}
		fs.appendFileSync(filename, '\nTotal Bits: ' + total_count);
		console.log(total_count);
	}

	//prompt user for input file name and directory
	private prompt_user_for_input(def:string):string {
		let filename: string = readline.question(">> ");
		if (filename === 'default') {
			return def;
			}
		if (fs.existsSync(filename)) {
			console.log(filename + " is found.");
			return filename;
		}
		else {
			console.log("file is not found. Please try again.");
			console.log("You can also type 'default' to get the default file we prepare for you.")
			return this.prompt_user_for_input(def);
		}
	}

	//main function
	start_encode_process() {
		console.log("Huffman encoding process starts.");
		console.log("Please give me target file.");
		console.log("You can type in the format of 'directory+filename', such as 'files/infile.dat'");
		console.log("or just the filename if it is in current working directory.");
		let default_input_filename: string = 'files/infile.dat';
		let input_filename: string = this.prompt_user_for_input(default_input_filename);
		console.log("Please type in directory and file name for output.");
		console.log("You can type in the format of 'directory+filename' as before.");
		console.log("or you just type 'default' to use default setting, which is 'files/outfile.dat'");
		let output_filename: string = readline.question(">> ");
		if (output_filename === 'default') {
			output_filename = 'files/outfile.dat';
		}
		console.log("output filename is obtained. Encoding process begins...")
		this.load_data(input_filename);
		this.process_data();
		this.merge();
		this.encode();
		this.output(output_filename);
		console.log("output has been save in " + output_filename + ".")
	}
}

//testing.
//default input: infile.dat
//default output: outfile.dat

let he = new HuffmanEncode();
he.start_encode_process();

