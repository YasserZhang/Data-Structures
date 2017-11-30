//import {Node} from './Node';
/*
class TreeNode {
    val: number;
    left: number;
    right: number;
    parent: number;
    constructor(val: number, index: number){
        this.val = val || null;
    }
}*/
interface TreeNode {
    val?: number;
    index?: number;
    left?: number;
    right?: number;
    parent?: number;
}
class Heap<T> {
    private root: TreeNode;
    heap: TreeNode[];

    constructor() {
        this.root = null;
        let node: TreeNode = {val: 0, index: 0, left: null, right: null, parent: null};
        this.heap.push(node);
        this.heap.push(this.root);
    }
}

let t = new Heap();
console.log(t.heap);