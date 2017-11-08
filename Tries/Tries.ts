/**
 * Tries
 * 
 * there should be nodes 
 * each node has a key, a value, a children hash table
 * in children hash table, there are also nodes, child nodes which have the same
 * structure.
 * 
 * 
 * 
 * In the Tries structure
 * there is root, which is null, but has a children hash table
 * 
 * methods
 * insert word
 * when word is to be inserted, the method iterate through all matching nodes
 * by checking keys, if all characters in the word are found, then return null.
 * if some characters are not found, create them as child nodes under a found
 * character.
 * 
 * check a word
 * similar to insert, only difference is that it return boolean
 * 
 *  
 * questions specific to the homework
 * how to save the article into the Trie structure?
 * I think punctuations should be ignored.
 * 
 * My plan to do this homework.
 * first of all, think big: how about find a hug amount of data from web
 * and save them into Trie, with each word having a count in the Trie
 * structure.
 * second, it would be cool to search each word, and you can calculate the frequency
 * in the whole data.
 * 
 * Question: how to parse the article?
 * No, actually build a trie with company names
 * 
 * Tries structure is built, quite easy
 * next question is how to read in an article line by line
 * this should not be difficult.
 * solved, js read in an article as string. 
 * after read in, set a pointer to traverse each word, check it against 
 * the tries.
 * 
 * 
 * another question is trying to create a company name list according to
 * the instruction, and load it into trie.
 * 
 * 
 * 
 */
import {TrieNode} from './TrieNode';
import * as assert from 'assert';
export class Tries {
    root: TrieNode;
    total_words: number;
    constructor() {
        this.root = new TrieNode();
        this.total_words = 0;
    }
    //search a word

    //non-recursion
    check_word(word:string, get_count:boolean = false, update_count: boolean = false): any {
        let current = this.root;
        for (let i = 0; i < word.length; i++) {
            if (word[i] in current.children) {
                current = current.children[word[i]];
            } else {
                console.log('word is not found.');
                return false;
            }
        }
        if (update_count) {
            current.count++;
        }
        if (current.count > 0) {
            if (get_count) {
                return current.count;
            } else {
                return true;
            }
        } else {
            console.log('reach the end of the word.');
            console.log('word is not found.');
            return false;
        }
    }
    //insert a word
    private create_new_node(current_node: TrieNode, key: string, start_index: number): TrieNode {
        for (let i = start_index; i < key.length; i++) {
            current_node.children[key[i]] = new TrieNode(key[i]);
            current_node = current_node.children[key[i]];
        }
        return current_node;
    }

    insert(key: string, update_count: boolean = false) {
        key = key.trim();
        if (key === '') {
            return;
        }
        let current: TrieNode = this.root;
        let i: number = 0;
        while (i < key.length) {
            //console.log(current);
            if (key[i] in current.children) {
                current = current.children[key[i]];
                i++;
            } else {
                this.total_words++;
                current = this.create_new_node(current, key, i);
                i = key.length;
            }
        }
        if (update_count) {
            current.count++;
        } 
        console.log("inserted " + key);
    }

    get_word_count(word: string): any {
        return this.check_word(word, true, false);
    }

    get_total_words() {
        return this.total_words;
    }
}
/**
 * testing...
 * let tries = new Tries();
 * tries.insert('microsoft', true);
 * tries.insert('Amgen Inc', true);
 * console.log(tries.check_word('Amgen Inc'));
 * 
 * 
 */
