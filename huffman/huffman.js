"use strict";
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
exports.__esModule = true;
var fs = require("fs");
var readline = require("readline-Sync");
var assert = require("assert");
var PriorityQueue_1 = require("./PriorityQueue");
var TreeNode = /** @class */ (function () {
    function TreeNode(name, val) {
        this.name = name || null;
        this.val = val || null;
        this.parent = null;
        this.left = null;
        this.right = null;
        this.label = null;
        this.code = null;
    }
    return TreeNode;
}());
var HuffmanEncode = /** @class */ (function () {
    function HuffmanEncode() {
        this.data = null;
        //this.frequency_table = {};
    }
    HuffmanEncode.prototype.load_data = function (filename) {
        //TODO: check the validity of filename, whether it exists.
        this.data = fs.readFileSync(filename, 'utf8');
        this.data = this.data.replace(/[^A-Za-z0-9]/g, '');
        //console.log(this.data);
    };
    HuffmanEncode.prototype.process_data = function () {
        //create frequency table and create forest
        assert.notEqual(this.data, null, "Error: no data!");
        var table = {};
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i] in table) {
                table[this.data[i]]++;
            }
            else {
                table[this.data[i]] = 1;
            }
        }
        this.frequency_queue = new PriorityQueue_1.PriorityQueue(function (x, y) { return x.val - y.val; }); //max heap
        this.min_queue = new PriorityQueue_1.PriorityQueue(function (x, y) { return y.val - x.val; }); //min heap
        for (var key in table) {
            //update the table values as percentages
            //let freq: number = Math.round(table[key] / this.data.length * 100);
            //create leaf nodes and push into the priority Queue
            var leaf = new TreeNode(key, table[key]);
            //this.frequency_table[key] = [freq, leaf];
            this.frequency_queue.enqueue(leaf);
            this.min_queue.enqueue(leaf);
        }
        //console.log(this.frequency_table);
    };
    HuffmanEncode.prototype.merge = function () {
        //output: a single tree node
        while (true) {
            var first_poll = this.min_queue.dequeue();
            var second_poll = this.min_queue.dequeue();
            var parent_name = first_poll.name + '-' + second_poll.name;
            var parent_val = first_poll.val + second_poll.val;
            var new_parent = new TreeNode(parent_name, parent_val);
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
            this.min_queue.enqueue(new_parent);
        }
    };
    //Use DFS to label and encode all nodes
    //recursion
    HuffmanEncode.prototype.dfs = function (parent) {
        if (parent.left === null && parent.right === null) {
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
    };
    HuffmanEncode.prototype.encode = function () {
        //base case
        this.dfs(this.merged_node);
    };
    HuffmanEncode.prototype.print = function () {
        console.log(this.frequency_queue.get_queue());
    };
    HuffmanEncode.prototype.repeat_padding_space = function (num) {
        var space = ' ';
        for (var i = 1; i < num; i++) {
            space = space + ' ';
        }
        return space;
    };
    HuffmanEncode.prototype.output_frequency_table = function (node) {
        var freq_perc = ((node.val / this.data.length) * 100).toFixed(3).toString();
        var space = this.repeat_padding_space(10 - freq_perc.length + 1);
        var result = node.name + ',' + space + freq_perc + "%";
        //console.log(result);
        return result;
    };
    HuffmanEncode.prototype.output_huffman_code = function (node) {
        var code = node.code;
        var space = this.repeat_padding_space(10);
        var result = node.name + ',' + space + code;
        return result;
    };
    //write into the output.dat
    HuffmanEncode.prototype.output = function (filename) {
        var frequency_table_output = [];
        var huffman_code_output = [];
        var total_count = 0;
        while (!this.frequency_queue.empty()) {
            var node = this.frequency_queue.dequeue();
            total_count = total_count + node.code.length * node.val;
            var frequency = this.output_frequency_table(node);
            var huffman_code = this.output_huffman_code(node);
            frequency_table_output.push(frequency);
            huffman_code_output.push(huffman_code);
        }
        fs.writeFileSync(filename, 'Symbol' + this.repeat_padding_space(5) + "Frequency\n");
        for (var _i = 0, frequency_table_output_1 = frequency_table_output; _i < frequency_table_output_1.length; _i++) {
            var freq = frequency_table_output_1[_i];
            fs.appendFileSync(filename, freq + '\n');
            console.log(freq);
        }
        fs.appendFileSync(filename, '\n\nSymbol' + this.repeat_padding_space(5) + "Huffman Codes\n");
        for (var _a = 0, huffman_code_output_1 = huffman_code_output; _a < huffman_code_output_1.length; _a++) {
            var code = huffman_code_output_1[_a];
            fs.appendFileSync(filename, code + '\n');
            console.log(code);
        }
        fs.appendFileSync(filename, '\nTotal Bits: ' + total_count);
        console.log(total_count);
    };
    HuffmanEncode.prototype.prompt_user_for_input = function (def) {
        var filename = readline.question(">> ");
        if (filename === 'default') {
            return def;
        }
        if (fs.existsSync(filename)) {
            console.log(filename + " is found.");
            return filename;
        }
        else {
            console.log("file is not found. Please try again.");
            console.log("You can also type 'default' to get the default file we prepare for you.");
            return this.prompt_user_for_input(def);
        }
    };
    HuffmanEncode.prototype.start_encode_process = function () {
        console.log("Huffman encoding process starts.");
        console.log("Please give me target file.");
        console.log("You can type in the format of 'directory+filename', such as 'files/infile.dat'");
        console.log("or just the filename if it is in current working directory.");
        var default_input_filename = 'files/infile.dat';
        var input_filename = this.prompt_user_for_input(default_input_filename);
        console.log("Please type in directory and file name for output.");
        console.log("You can type in the format of 'directory+filename' as before.");
        console.log("or you just type 'default' to use default setting, which is 'files/outfile.dat'");
        var output_filename = readline.question(">> ");
        if (output_filename === 'default') {
            output_filename = 'files/outfile.dat';
        }
        console.log("output filename is obtained. Encoding process begins...");
        this.load_data(input_filename);
        this.process_data();
        this.merge();
        this.encode();
        this.output(output_filename);
        console.log("output has been save in " + output_filename + ".");
    };
    return HuffmanEncode;
}());
//testing.
//default input: infile.dat
//default output: outfile.dat
var he = new HuffmanEncode();
he.start_encode_process();
