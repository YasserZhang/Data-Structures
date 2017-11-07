export class TrieNode {
    key: string;
    count: number;
    children: Object;
    constructor(key: string = null) {
       this.key = key;
       this.count = 0;
       this.children = {};
    }
}
