var readlineSync  = require('readline-sync');
function start(){
    while(true){
        var express = askExpression();
        if(express === 'quit'){
            break;
        }
        
        var opStack = new Stack();
        var postQ = new Queue();
        var infixQ = new Queue();
        for(var i = 0; i< express.length;i++){    // put express into a qunue named infixQ
            infixQ.enqueue(express[i]);
        }

        console.log('The infix expression is :');
        console.log( infixQ.showQueue());

        conversion(opStack,postQ,infixQ);     //call conversion function to transfer infix to postfix expression
        
        var postfixQ = new Queue();

        var output = '';                      // add postfix expression with space, and put postfix queue into a new queue named postfixQ ( postfixQ and postQ are same queue)
        while(postQ.size() != 0){
            var str = '';
            if(postQ.front() == '^'){
                 str = 'POW';
            }
            else{
                str = postQ.front();
            }
            output += str + " ";
            postfixQ.enqueue(postQ.dequeue());
        }
        //console.log("The postfix expression is : " + "\n"+output);
            
           // transferpostfix(postQ);
        var eval = new Stack();
        //var result  = caculation(postfixQ,eval);
        try{
            if(isNaN(caculation(postfixQ,eval))){
                throw "The input is invalid please try again!"
            }
        }catch(e){
            console.error(e);
            continue;
        }

        console.log("The postfix expression is : " + "\n"+output);
        console.log("The expression resule is :" + "\n"+ caculation(postfixQ,eval));
            //console.log(caculation(postfixQ.eval))
    }
}
start();

/*
function checkExpress(express){
    //var checkexpression = new stack1.Stack();
    for(var i =0;i<express.length;i++){
        //negative in first
        if((i=0 && express[i] == '-') || (i>0 && express[i] =='-' && express[i-1] == '(')){
            throw "There is a negative number which is not permit"
        }else
            return express;
        
    }
    
}

*/
function conversion(opStack,postQ,infixQ){
    while(infixQ.size() != 0){
        var t = infixQ.front();
        infixQ.dequeue();
        // why isoperator(t) == false 会报错？
        if(!isOperator(t)){
            postQ.enqueue(t);
        }
        else if(opStack.size() == 0){
            opStack.push(t);
        }
        else if(t == '('){
            opStack.push(t);
        }
        else if(t == ')'){
            while(opStack.peek() != '('){
                postQ.enqueue(opStack.peek());
                opStack.pop();
            }
            opStack.pop(); // discard a left paren from stack
        }
        else{
            while(opStack.size() != 0 && opStack.peek() != '(' && precedence(t) <= precedence(opStack.peek())){
                postQ.enqueue(opStack.peek());
                opStack.pop();
            }
            opStack.push(t);
        }
    }
    while(opStack.size() != 0){
        postQ.enqueue(opStack.peek());
        opStack.pop();
    }

    //console.log(postQ.showQueue());
}

function caculation(postfixQ,eval){
    while(postfixQ.size() != 0){
        var t = postfixQ.dequeue();
        //console.log(t);
        if(isOperator(t)==false){
            eval.push(t);
            //console.log(eval.peek());
        }
        else{
            var topNum = eval.peek();
            eval.pop();
            //console.log(topNum);
            var nextNum = eval.peek();
            eval.pop();
            //console.log(nextNum);
            var answer;
            switch(t){
                case '+': answer = parseInt(nextNum) + parseInt(topNum);
                break;
                case '-': answer = parseInt(nextNum) - parseInt(topNum);
                break;
                case '*': answer = parseInt(nextNum) * parseInt(topNum);
                break;
                case '/': answer = parseInt(nextNum) / parseInt(topNum);
                break;
                case '%': answer = parseInt(nextNum) % parseInt(topNum);
                break;
                case '^': answer = Math.pow(parseInt(nextNum),parseInt(topNum));
                break;
                default: 
                    break;
            }
            eval.push(answer.toString());
        }
    }
    return eval.peek();

}


function precedence(operator){
    switch(operator){
        case '+' : return 1;
        case '-' : return 1;
        case '*' : return 2;
        case '/' : return 2;
        case '^' : return 3;
    }

}

function isOperator(t){
    switch(t){
        case '+': return true;
        case '-': return true;
        case '*': return true;
        case '/': return true;
        case '%': return true;
        case '^': return true;
        case '(': return true;
        case ')': return true;
        default: return false;
    }
    
}

//get a expression from the user input
function askExpression(){
    console.log('please write a expression.\n');
    var express = readlineSync.question('>> ');
    if(express === 'quit'){
        console.log("Bye! See you next time! ");
       return express;
    }else{
        express = express.replace(/\s/g,"");   // replace space
        express = express.replace(/POW/g,'^');  //replace POW with ^

        express = express.match(/[1-9][0-9]*|[+*-/^%\(\)]/g); // a reqular expression which can match all numbers and operators in a input expression
        console.log(express);
        return express;
    }
}

/*
function transferpostfix(postQ,postfixQ){
    var output = '';
    while(postQ.size() != 0){
        var str = '';
        if(postQ.front() == '^'){
            str = 'POW';
        }
        else{
            str = postQ.dequeue();
        }
        output += str + " ";
        postfixQ.enqueue(postQ.dequeue());
    }
    return console.log("The postfix expression is : " + output);
}
*/

//Queue
function Queue(){
    var arr = [];
    /**
    * enqueue
    */
    this.enqueue = function(element){
        arr.push(element);
    }

    /**
     *dequeue 
     */
    this.dequeue = function(){
        return arr.shift();
    }

    /**
     * front
     */
    this.front = function(){
        return arr[0];
    }

    /**
     * isempty?
     */
    this.isEmpty = function(){
        return arr.length === 0;
    }

    /**
     * clear
     */
    this.clear = function(){
        arr = [];
    }

    /**
     * length
     */
    this.size = function(){
        return arr.length;
    }

    this.showQueue = function(){
        return arr;
    }
}

// Stack
function Stack(){
    /**
     * use array to implement stack
     */
    var arr = new Array();

    /**
     * push
     */
    this.push = function(element){
        arr.push(element);
    }

    /**
     * pop
     */
    this.pop = function(){
        return arr.pop();
    }

    /**
     * peek查看栈顶元素
     */
    this.peek = function(){
        return arr[arr.length-1];
    }

    /**
     * return length返回栈长度
     */
    this.size = function(){
        return arr.length;
    }

    /**
     * clean清楚栈中所有内容
     */
    this.clear = function(){
        arr = new Array();
    }
    
    this.showStack = function(){
        return arr;
    }

    this.front = function(){
        return arr[0];
    }
}
