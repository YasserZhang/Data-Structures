type Prioritizer<T> = (x: T, y: T) => number;
export class PriorityQueue<T> {
    private arr: T[];
    private prioritizer: Prioritizer<T>;
    constructor(prioritizer: Prioritizer<T>) {
        this.arr = [];
        this.prioritizer = prioritizer;
    }
    public empty() {
        return this.arr.length == 0;
    }
    public enqueue(value: T){
        if (this.arr.length == 0) {
            this.arr.push(value);
            //console.log(value);
            return;
        }
        let added: boolean = false;
        for (let i: number = 0; i < this.arr.length; i++) {
            if (this.prioritizer(value, this.arr[i]) <= 0) {
                continue;
            }
            this.arr.splice(i, 0, value);
            added = true;
            break;
        }
        if (!added) {
            this.arr.push(value);
        }
        //console.log(value);

    }
    public dequeue(): T {
        return this.arr.shift();
    }
    public peek(): T {
        return this.arr[0];
    }
    public print_queue() {
        console.log(this.arr);
    }
    public get_queue(): T[] {
        return this.arr;
    }
}


