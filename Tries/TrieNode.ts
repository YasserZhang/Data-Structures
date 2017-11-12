export class TrieNode {
    key: string;
    word_end: boolean;
    children: Object;
    primary_key: string;
    constructor(key: string = null) {
       this.key = key;
       this.word_end = false;
       this.children = {};
        this.primary_key = null;
    }
    add_primary_key(p_k: string) {
        this.primary_key = p_k;
    }
}
