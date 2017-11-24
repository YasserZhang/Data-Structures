import {Tries} from './Tries';
import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
/**
 * how can you check the end symbol for reading?
 * a single period at a new line
 * \n.\n or \n.^
 * I only need to care about the former case
 * since the latter case is equivelant to the ending of
 * an article, it is actually a natural end.
 * 
 * when meet a '\n', check if next two characters are '.\n'
 * 
 * TODO:
 * next step
 * check words in the article.
 * 
 * need to find a way to count the frequency of each company.
 * 
 * 
 * a bigger idea
 * streaming in current articles from yahoo fanancial or google
 * to see which companies are the most trendy words in media.
 * 
 * 
 * 
 * 
 * 
 */
export class SearchArticles {
    tries: Tries;
    total_count: number;
    primary_name_hashmap: {[key:string]:number};
    trivial_words: Set<string>;
    maximum_name_length: number;
    constructor() {
        this.tries = new Tries();
        this.total_count = 0;
        this.primary_name_hashmap = {};
        this.trivial_words = new Set(['a', 'an', 'the', 'or', 'but']);
        this.maximum_name_length = 0;
    }

    create_tries(filepath: string, filename: string) {
        let file: string = path.join(filepath, filename);
        assert.notEqual(fs.existsSync(file), false, 
                                "No such file is found.");
        let names_list: string = fs.readFileSync(file, 'utf8');
        //console.log(names_list);
        let companies: Array<string> = names_list.split('\n');
        for (let company of companies) {
            let names: Array<string> = company.split('\t');
            //console.log(names);
            let primary_name: string = names[0];
            this.maximum_name_length = Math.max(this.maximum_name_length,
                                         primary_name.length);
            for (let name of names) {
                //strip all punctuations, including space
                name = name.replace(/[^A-Za-z0-9]/g, '');
                this.tries.insert(name, primary_name);
            }
        }
        console.log("Total Words in Trie: ", this.tries.get_total_words());
    }
    //read in article, return a string
    private read_article(filename): string {
        //filename = path.join(filepath, filename);
        assert.notEqual(fs.existsSync(filename), false, 
                                "No such file is found.");
        let article: string = fs.readFileSync(filename, 'utf8');
        return article;
    }

    search_article(filename) {
        let article: string = this.read_article(filename);
        let paragraphs: string[] = article.split('\n');
        //testing: check total count of words in a paragraph
        //let word_count = 0;
        for (let paragraph of paragraphs) {
            let pointer = 0;
            if (paragraph === '.') {
                console.log("search done.");
                break;
            }
            paragraph = paragraph.replace(/'s|[^A-Za-z0-9 ]/g, '');
            //console.log(paragraph);
            //testing: check total count of words in a paragraph
            //word_count = word_count + paragraph.split(' ').length;
            while (pointer < paragraph.length) {
                //console.log(pointer);
                pointer = this.count_keyword(paragraph, pointer);
            }
        }
        //print total count of words in a paragraph
        //console.log("word count: ", word_count);
    }

    private check_inside_company_name(words: string, primary_name: string){
        let i: number = 0;
        while (i < words.length) {
            if (words[i] !== ' ') {
                i++;
            } else {
                i++;
                let results = this.tries.search_paragraph_for_keyword(words, i);
                if (results[0] !== null && results[0] != primary_name) {
                    if (results[0] in this.primary_name_hashmap){
                        this.primary_name_hashmap[results[0]]++;
                    } else {
                        this.primary_name_hashmap[results[0]] = 1;
                    }
                }
            }
        }
    }

    private count_keyword(paragraph: string, start_index: number): number {
        let results = this.tries.search_paragraph_for_keyword(paragraph, start_index);
        let end:number = results[1];
        //console.log(results);
        if (results[0] !== null) {
            //update company name count and total word count
            //console.log(results[0]);
            if (results[0] in this.primary_name_hashmap){
                this.primary_name_hashmap[results[0]]++;
            } else {
                this.primary_name_hashmap[results[0]] = 1;
            }
            let words = paragraph.substring(start_index, end - 1);
            this.check_inside_company_name(words, results[0]);
            this.total_count = this.total_count + words.split(' ').length;
            return end;
        } else {
            while (end < paragraph.length && paragraph[end] != ' ') {
                end++;
            }
            let word = paragraph.substring(start_index, end);
            if (!(this.trivial_words.has(word))) {
                this.total_count++;
            } //else {
                //console.log("a trivial word", word);
            //}
            return end + 1;
        }
    }
}
/*
console.log("file exists ",fs.existsSync('company.dat'));
let tries = new SearchArticles();
let company_file = 'company.dat';
tries.create_tries('', company_file);
tries.search_article('files/article1.txt')
console.log("primary name, ",tries.primary_name_hashmap);
console.log("total count", tries.total_count);
console.log("Nvidia", tries.tries.exists('Nvidia'));
*/
