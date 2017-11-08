import {Tries} from './Tries';
import * as fs from 'fs';
import * as path from 'path';
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
class readIn {
    tries: Tries;
    constructor() {
        this.tries = new Tries();
    }
    create_tries(filepath: string, filename: string) {
        let file: string = path.join(filepath, filename);
        let names_list: string = fs.readFileSync(file, 'utf8');
        let companies: Array<string> = names_list.split('\n');
        for (let company of companies) {
            let names: Array<string> = company.split('\t');
            for (let name of names) {
                name = name.replace(/[^A-Za-z0-9 ]/g, '');
                this.tries.insert(name, true);
            }
        }
        console.log(this.tries.get_total_words());
    }
    read_article(filepath, filename) {
        filename = path.join(filepath, filename);
        let article: string = fs.readFileSync(filename, 'utf8');
        
    }
    check_word(word:string, get_count:boolean = false, update_count: boolean = false) {
        return this.tries.check_word(word, get_count, update_count);
    }
}

let tries = new readIn();
tries.create_tries('', 'companies.txt');
console.log(tries.check_word('Wm Wrigley Jr Company'));
console.log()
//tries.read_article('', 'test.txt');
