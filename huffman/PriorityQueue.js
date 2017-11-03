"use strict";
exports.__esModule = true;
var PriorityQueue = /** @class */ (function () {
    function PriorityQueue(prioritizer) {
        this.arr = [];
        this.prioritizer = prioritizer;
    }
    PriorityQueue.prototype.empty = function () {
        return this.arr.length == 0;
    };
    PriorityQueue.prototype.enqueue = function (value) {
        if (this.arr.length == 0) {
            this.arr.push(value);
            //console.log(value);
            return;
        }
        var added = false;
        for (var i = 0; i < this.arr.length; i++) {
            if (this.prioritizer(value, this.arr[i]) < 0) {
                continue;
            }
            this.arr.splice(i, 0, value);
            added = true;
            break;
        }
        if (!added) {
            this.arr.push(value);
        }
    };
    PriorityQueue.prototype.dequeue = function () {
        return this.arr.shift();
    };
    PriorityQueue.prototype.peek = function () {
        return this.arr[0];
    };
    PriorityQueue.prototype.print_queue = function () {
        console.log(this.arr);
    };
    PriorityQueue.prototype.get_queue = function () {
        return this.arr;
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;
