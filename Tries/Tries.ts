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
 * exists
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
export class Tries {
    root: TrieNode;
    total_words: number;
    constructor() {
        this.root = new TrieNode();
        this.total_words = 0;
    }
    //search a keyword in a paragraph
    //return as soon as check out a keyword, or mismatch happens
    search_paragraph_for_keyword(paragraph: string, start_index: number): [string, number] {
        /*
        input: 
            a paragraph; 
            start_index: a pointer for the paragraph;
        output: [primary_name, end_point];
        if find a keyword, 
            return the primary_name of the keyword,
            and the start index of the next word right after the keyword.
        if mismatch, 
            return [null, start_index];
        */
        if (paragraph.length == 0) {
            return [null, 0];
        }
        let i: number = start_index;
        let current: TrieNode = this.root;
        while (i < paragraph.length) {
            if (paragraph[i] === ' ') {
                i++;
                continue;
            }
            if (paragraph[i] in current.children) {
                current = current.children[paragraph[i]];
                i++;
            } else {
                break;
            }
            if (current.word_end) {
                break;
            }
        }
        //check if it is a match.
        //if touch a leaf, check whether the word
        //in the paragraph is a correct compnay name.
        //it could be a part of other word, such as Intelligence 
        //as opposed to Intel.
        //console.log(paragraph.substring(start_index, i), current.word_end);
        if (current.word_end) {
            if (paragraph[i] === ' ') {
                //console.log("get in true condition", paragraph.substring(start_index, i + 1));
                return [current.primary_key, i + 1];
            }else {
                //console.log("get in false condition", paragraph.substring(start_index, i + 1));
                return [null, start_index];
            }
        } else {
            //console.log("current is not word end", paragraph.substring(start_index, i + 1));
            return [null, start_index];
        }
    }
    //check if a single word exists in trie
    exists(word: string): boolean {
        let current: TrieNode = this.root;
        for (let i = 0; i < word.length; i++) {
            if (word[i] in current.children) {
                current = current.children[word[i]];
            } else {
                return false;
            }
        }
        if (current.word_end) {
            return true;
        } 
        return false;
    }

    //insert a word
    private create_new_node(current_node: TrieNode, key: string, start_index: number): TrieNode {
        for (let i = start_index; i < key.length; i++) {
            current_node.children[key[i]] = new TrieNode(key[i]);
            current_node = current_node.children[key[i]];
        }
        return current_node;
    }
    //insert names, without spaces
    insert(key: string, primary_key: string) {
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
        current.word_end = true;
        current.add_primary_key(primary_key);
        console.log("inserted " + key);
    }
    /*
    get_word_count(word: string): any {
        return this.check_word(word, true, false);
    }
    */
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

 //let tries = new Tries();
 //tries.insert('microsoft', 'Microsoft');
 //tries.insert('The Microsoft Corporation', 'Microsoft');
 //tries.insert('Amgen Inc', 'Amgen');
