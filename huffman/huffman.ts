/**
 * plans
 * 1. create heap for input frequency table
 * 2. update the forest
 * 	queue = [node1, node2, node3, node4, node5];
 *  make a copy of the queue.
 *  copy = [node1, node2, node3, node4, node5];
 * 	create parent nodes;
 * 
 * 
 * 
 * questions: how can I create nested clasess?
 * seems not working if TreeNode is inside the HuffmanEncode, which makes error when I instantiate a tree node
 * 
 * 
 * 
 * bugs:
 * reference types confusion
 * hypo: JS may have different reference rules.
 * test: experiment with JS to find its rules.
 * result: `shift` method may be a deep copy \\WRONG
 * 
 * In the process of detecting the bug, the code works though I haven't done any fix to it.
 * 
 * Nothing could be more frustrating than the fact that a malfunction disappears all of sudden without giving you
 * any clue of what might have fixed it.
 * 
 */

import * as fs from 'fs';
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
	frequency_queue: PriorityQueue<TreeNode>;
	min_queue: PriorityQueue<TreeNode>;
	merged_node: TreeNode;
	

	constructor(){
		this.data = null;
		//this.frequency_table = {};
	}
	load_data(filename){
		//TODO: check the validity of filename, whether it exists.
		
		this.data = fs.readFileSync(filename, 'utf8');
		this.data = this.data.replace(/[^A-Za-z0-9]/g, '');
		//console.log(this.data);
	}
	
	process_data(){
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
		this.frequency_queue = new PriorityQueue<TreeNode>((x, y) => x.val - y.val); //max heap
		this.min_queue = new PriorityQueue<TreeNode>((x, y) => y.val - x.val); //min heap

		for (var key in table) {
			//update the table values as percentages
			//let freq: number = Math.round(table[key] / this.data.length * 100);
			//create leaf nodes and push into the priority Queue
			let leaf: TreeNode = new TreeNode(key, table[key]);
			//this.frequency_table[key] = [freq, leaf];
			this.frequency_queue.enqueue(leaf);
			this.min_queue.enqueue(leaf);
		}
		//console.log(this.frequency_table);
	}
	//TODO: write the frequency table;


	//testing method

	//
	merge() {
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
		if (parent.left === null && parent.right === null){
			//console.log(parent);
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
	encode() {
		//base case
		this.dfs(this.merged_node);

	}

	print() {
		console.log(this.frequency_queue.get_queue());
	}
	private repeat_padding_space(num:number): string {
		let space = ' ';
		for(let i = 1; i < num; i++){
			space = space + ' ';
		}
		return space;
	}

	private output_frequency_table(node: TreeNode): string {
		let freq_perc: any = ((node.val / this.data.length) * 100).toFixed(3).toString();
		let space: string = this.repeat_padding_space(10 - freq_perc.length + 1);
		let result: string = node.name + ','+ space + freq_perc + "%";
		//console.log(result);
		return result;
	}

	private output_huffman_code(node: TreeNode): string {
		let code: string = node.code;
		let space: string = this.repeat_padding_space(10);
		let result: string = node.name + ','+ space + code;
		return result;
	}
	//write into the output.dat
	output(filename) {
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
}

let he = new HuffmanEncode();
he.load_data('nodejspara.txt');
he.process_data();
he.merge();
/*for (let n in he.frequency_table){
	console.log(he.frequency_table[n][1].parent);
}*/
he.encode();
he.output('outfile.dat');
//he.print();
//console.log(he.frequency_table);
/*
let queue = new PriorityQueue<TreeNode>((x, y) => y.val - x.val);
queue.enqueue(a);
queue.enqueue(b);
queue.enqueue(c);
queue.enqueue(d);
queue.print_queue();*/