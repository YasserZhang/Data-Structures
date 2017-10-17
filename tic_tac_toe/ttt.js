/**
 * STRUCTURE OF THE CODE
 * main @function startGame() is called to start the work flow;
 * 
 * Branch 1 in @function startGame:
 * here players choose to resume a saved game
 * they need @function pickAFile to get file name;
 * they need @function readData to load game data;
 * they need @function loadInBoard to load previous moves to game board;
 * they need @function gameOnGoing to finished the rest part of the game;
 * 
 *     Within gameOnGoing:
 *          it calls @function getMove to get a valid @param symbol from player, or order to quit;
 *          it calls @function fillInSpot to put a @param symbol in an empty position in the @param board
 *          it calls @function checkWinner to check if a @param winner comes out, or a draw is reached;
 *          if quit:
 *              if calls @function askSave to request a filename to save game data.
 *
 * Branch 2 in @function startGame (choose 'no'):
 * here players choose to start a new game,
 * it calls @function askNumberOfPlayers for input of number of players;
 * then it request names of players iteratively;
 * it calls @function sizeOfBoard to get the board @param size;
 * it calls @function initGameBoard(@param size) to initialize a new board;
 * it calls @function winSequenceCount(@param size) to get @param winNumber, the size of a winning sequence of count;
 * at last it calls @function gameOnGoing to start a new game.
 * the rest is the same as Branch 1.
 * 
 * 
 * Branch 3 in @function startGame (choose 'quit'):
 * herer players quit without doing anything;
 * 
 * Branch 4 in @function startGame:
 * this is a defensive setting in case players types something meaningless.
 * it recursively redirects players to the beginning of @function startGame();
 *
 */

const fs = require('fs');
const readlineSync = require('readline-sync');

//welcome to Tic Tac Toe.
console.log('\x1b[36m%s\x1b[0m',"Welcome to Tic Tac Toe Game!\n");
console.log('\x1b[36m%s\x1b[0m','Would you like to resume an unfinished game[yes/no/quit]?');

//main function is called here.
startGame();

//initialize variables
var dataToSave; // to store loaded json file of a saved game
var board; // 2D arrays to represent the game board
var size; // size of the board

//functions list in the depth-first order of their appearances in the work flow;
function startGame(){
    var startAGame = readlineSync.question('>> ');
    //if start a new game
    var filepath = './saved_games/'; //a subfolder to save game data
    var symbols = 'XOABCDEFGHIJKLMNPQRSTUVWYZ';
    var numPlayers; //number of players
    var winNumber; //number of consecutive symbols for win
    var players; //an array of player names
    var nameToSymbol; //a map of (player name : symbol)
    var totalMoves; // move count
    if(startAGame == 'yes'){
        //resume a saved game.
        fs.readdirSync(filepath).forEach(file => {
            console.log('\x1b[36m%s\x1b[0m', file.split('.json')[0]);
        });
        var savedFile = pickAFile(filepath);
        if (savedFile != 'Q'){
            //load in data
            dataToSave = readData(filepath, savedFile);
            console.log(dataToSave);
            //load in parameters
            numPlayers = dataToSave['numPlayers'];
            size = dataToSave['boardSize'];
            winNumber = dataToSave['winNumber'];
            players = dataToSave['names'];
            nameToSymbol = dataToSave['playerToSymbol'];
            totalMoves = dataToSave['moveCount'];
            board = loadInBoard(dataToSave);
            //console.log(typeof numPlayers);
            //let player take turns to move symbols.
            console.log('\x1b[36m%s\x1b[0m','All set! Game on!\n');
            console.log('\x1b[36m%s\x1b[0m','Please take turn to put your symbol on the board.\n');
            console.log('\x1b[36m%s\x1b[0m','To put your symbol onto a specific position, you just type the row and column number of the board, seperated by one whitespace.\n');
            gameOnGoing(numPlayers, size, winNumber, players, nameToSymbol, totalMoves, filepath);
        }else{
            console.log('\x1b[36m%s\x1b[0m', "GoodBye. You can restart a game anytime.\n");
        }
        
        
    }else if (startAGame == 'no'){
        console.log('\x1b[36m%s\x1b[0m','Ok. Let us start a new game.');
        // ask how many players are playing as a prompt on its own line. the maximum number of players is 26.
        numPlayers = Number(askNumberOfPlayers());
        console.log('\x1b[36m%s\x1b[0m', 'numer of palyers is ' + numPlayers);
        //ask players' names and assign symbols to players
        console.log('\x1b[36m%s\x1b[0m', "Please tell me your names.\n");
        nameToSymbol = {}; //a map of (name, symbol);
        players = []; // names of players
        for(var i = 1; i <= numPlayers; i++){
            duplicateFlag = true;
            while(duplicateFlag){
                console.log('\x1b[36m%s\x1b[0m', 'Name of player ' + i + ':');
                let player = readlineSync.question('>> ');
                if(players.indexOf(player) < 0){
                    players.push(player);
                    nameToSymbol[player] = symbols[i-1];
                    duplicateFlag = false;
                }else{
                    console.log('\x1b[33m%s\x1b[0m', player + ' has been taken, pick another name.\n');
                }
            }
        }
        //console.log(players);
        console.log('\x1b[36m%s\x1b[0m', 'Each player has been assigned a symbol. Please check out the following name-symbole pair list and remember your own symbol.\n');
        console.log(nameToSymbol);
        console.log('\n\n\n');
        // ask how large the board should be as a prompt on its own line. The maximum number is 999.
        size = Number(sizeOfBoard(numPlayers));
        console.log('\x1b[36m%s\x1b[0m', 'size of board is ' + size);
        //initialize game board
        board = initGameBoard(size);
        //draw the board
        drawBoard(board);
        // ask what the win sequence count should be (i.e. 3 would be normal standard tic-tac-toe) as a prompt on its own line.
        console.log('\x1b[36m%s\x1b[0m','Now let us set up the standard for a final win.\n');
        winNumber = Number(winSequenceCount(size));
        console.log('\x1b[36m%s\x1b[0m','The winning sequence of count has been set as ' + winNumber + '.\n');
        console.log('\x1b[36m%s\x1b[0m','All set! Game on!\n');
        console.log('\x1b[36m%s\x1b[0m','Please take turn to put your symbol on the board.\n');
        console.log('\x1b[36m%s\x1b[0m','To put your symbol onto a specific position, you just type the row and column number of the board, seperated by one whitespace.\n');
        
        //game on!!!
        //while no winner and no draw and no quit order, keep running the game function.
        totalMoves = 0;
        gameOnGoing(numPlayers, size, winNumber, players, nameToSymbol, totalMoves, filepath);
        
    }else if (startAGame == 'quit'){
        //quit
        console.log('\x1b[36m%s\x1b[0m', 'You quit. See you next time.\n');
    }else{
        console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
        console.log('\x1b[36m%s\x1b[0m', "      Invalid input. Please type 'yes', 'no' or 'quit'.");
        console.log('\x1b[36m%s\x1b[0m', 'Would you like to resume an unfinished game[yes/no/quit]?');
        startGame(startAGame);
    }
}

/**
 * Branch 1 in @function startGame:
 * if players choose to resume a saved game
 * they need @function pickAFile to get file name;
 * they need @function readData to load game data;
 * they need @function loadInBoard to load previous moves to game board;
 * they need @function gameOnGoing to finished the rest part of the game;
 */

function pickAFile(filepath){
    //let filepath = './saved_games/';
    console.log('\x1b[36m%s\x1b[0m','\npick a filename from the existing files listed above. type "Q" to quit.\n');
    let savedFile = readlineSync.question(">> ");
    if (fs.existsSync(filepath+savedFile + '.json')) {
        return savedFile;
    }else if(savedFile == 'Q'){
        return savedFile;
    }
    
    else{
        console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
        console.log('\x1b[36m%s\x1b[0m', '      ' + savedFile + ' does not exist.\n\n');
        return pickAFile();
    }
}

//filename has not surfix
function readData(filepath, filename){
    let rawData = fs.readFileSync(filepath + filename + '.json');
    dataToSave = JSON.parse(rawData);
    return dataToSave;
}

//load saved moves into board;
function loadInBoard(dataToSave){
    board = dataToSave['board'];
    //draw the board;
    drawBoard(board);
    return board;
}

/** 
 * gameOnGoing:
 * input: all parameters given by users.
 * output: record every move into @param board; accommodate all orders given by users in the process of a game,
 * i.e., putting a @param symbol, or quit and save an unfinished game.
 * 
 * Within gameOnGoing:
 * it calls @function getMove to get a valid symbol from player, or order to quit;
 * it calls @function fillInSpot to put the symbol in an empty position in the board
 * it calls @function checkWinner to check if a @param winner comes out, or a draw is reached;
 * if quit:
 * if calls @function askSave to request a filename to save game data.
 */

function gameOnGoing(numPlayers, size, winNumber, players, nameToSymbol, totalMoves, filepath){
    //draw the board
    drawBoard(board);
    //initialize loop stop flags
    var winOut = false; //true when winner comes out;
    var quitFlag = false; // true when some quits
    //winner's name to be stored here.
    var winner = undefined; 
    while (totalMoves != size*size && !winOut && !quitFlag){
        let p = players[totalMoves % numPlayers]; //the player's name
        //console.log(totalMoves % numPlayers);
        //console.log('this is a p: ' + p);
        let s = nameToSymbol[p]; //the player's symbol
            
        let move = getMove(p, s);
            
        //update a move on game board; or quit;
        if(move.length === 2){
            totalMoves += 1;
            
            fillInSpot(Number(move[0]),Number(move[1]), s);
            //draw the board;
            drawBoard(board);
            //check out if winner comes out;
            if(totalMoves >= (winNumber - 1)*numPlayers + 1){
                winOut = checkWinner(Number(move[0]), Number(move[1]) , s, winNumber, size); //size must be added as a parameter here, otherwise it cannot be found in the scope, I don't know why while it can find board anyway.
                if(winOut){
                    //if yes, annouce the winner, and end the game.
                    winner = p;
                    console.log('\x1b[36m%s\x1b[0m', p + " has won! Congratulations!");
                }
            }
            
            if(totalMoves === size*size){
                //draw situation
                console.log('\x1b[36m%s\x1b[0m', "Game over. It is a draw.");
            }
        }else{//control flow comes here when user wants to quit in the middel of a game
            // double check if the user wants to store the file.
            console.log('\x1b[36m%s\x1b[0m', "Are you sure you want to quit in the middel of the game[y/n]?");
            let sureFlag = false;
            while(!sureFlag){
                let answ = readlineSync.question('>> ');
                if(answ === 'y'){
                    //askSave(filepath, numPlayers, players, nameToSymbol, size, totalMoves);
                    askSave(filepath, numPlayers, players, nameToSymbol, winNumber, size, totalMoves);
                    quitFlag = true;
                    sureFlag = true;
                }else if(answ === 'n'){
                    sureFlag = true;
                    continue;
                }else{
                    console.log('\x1b[33m%s\x1b[0m', "please type 'y' to quit, or 'n' to go back to the game.\n");
                }
            }
            
            
        }
    }
    
}

//get a move order from player, player either give row col, or type Q to quit.
function getMove(player, symbol){
    //flag = true;
    while(true){
        let move = readlineSync.question(player + '(' + symbol + '): '); // get a move
        if(move === 'Q'){
            return move;
        }
        else{
            result = move.split(' ');
                let r = Number(result[0]);
                let c = Number(result[1]);            
            if(result.length === 2 && !isNaN(r) && !isNaN(c)){
                if (r <= size && r > 0 && c <= size && c > 0){//check if the input is in the board
                    if (board[r][c] === ' '){
                        return result;
                    }else{
                        console.log('\x1b[33m%s\x1b[0m', 'This position has been taken, choose another position.\n');
                        return getMove(player, symbol);
                    }
                }else{//if not, repeat the process.
                    console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
                    console.log('\x1b[36m%s\x1b[0m', '      ' + move + ' is out of the range of the board.\n\n');
                    return getMove(player, symbol);
                }
            }else{
                console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
                console.log('\x1b[36m%s\x1b[0m', '      Invalid input. Please type in numbers of a row and a column separated by one whitespace, or just type "Q" to quit.');
                return getMove(player, symbol);
        }
            
        }
    }
    
}

//fill in a symbol into the game board.
//row and column indices match the inputs, zero index is padded off.
function fillInSpot(row, col, symbol){
    board[row][col] = symbol;
}

/**
 * check @param winner
 * to check a @param winner, need to check if rows, columns, diagonal, reverse diagonal have a winning sequence of count
 * after the latest move is put.
 * the function calls @function checkRowCol to check row and col;
 * the function calls @function checkDiag to check the diagonal;
 * the function calls @function checkReverseDiag to check the reverse diagonal;
 * output: boolean value to indicate winner or no winner;
 * 
 */
function checkWinner(row, col, symbol, winNumber, size){
    var checkRow = checkRowCol(row, col, symbol, winNumber, size, flag = 'r'); // check a row;
    var checkCol = checkRowCol(row, col, symbol, winNumber, size, flag = 'c'); // check a column;
    var checkD = checkDiag(row, col, symbol, winNumber, size); // check diagonal line
    var checkRD = checkReverseDiag(row, col, symbol, winNumber, size); // check reverse diagonal line
    var checked = checkRow || checkCol || checkD || checkRD;
    if(checked){
        return true;
    }
    return false;
}

//check winner at row and column,
//check row when flag = 'r';
//check column when flag = 'c';
function checkRowCol(row, col, symbol, winNumber, size, flag = 'r'){
    var count = 0;
    if(flag === 'r'){
        var c = Math.max(1, col - winNumber);
        var steps = 0;
        while(c <= size && count < winNumber && steps < 2*winNumber){
            if(board[row][c] == symbol){
                count += 1;
            }else{
                count = 0;
            }
            c += 1;
            steps += 1;
        }
    }else if(flag === 'c'){
        var r = Math.max(1, row - winNumber);
        var steps = 0;
        while(r <= size && count < winNumber && steps < 2*winNumber){
            if(board[r][col] == symbol){
                count += 1;
            }else{
                count = 0;
            }
            r += 1;
            steps += 1;
        }
    }
    
    if (count >= winNumber){
        return true;
    }
    return false;
}


//console.log(checkRowCol(2, 'X', 3, flag = 'r'));
function checkDiag(row, col, symbol, winNumber, size){
    var r = row;
    var c = col;
    var steps = 0;
    while (r > 1 && c > 1 && steps < winNumber){
        r -= 1;
        c -= 1;
        steps +=1;
    }
    //console.log("steps 1: " + steps);
    var count = 0;
    steps = 0;
    while(r <= size && c <= size && count < winNumber && steps <2*winNumber){
        if(board[r][c] == symbol){
            count += 1;
        }else{
            count = 0;
        }
        r += 1;
        c += 1;
        steps += 1;
    }
    //console.log("steps 2: " + steps);
    
    if (count >= winNumber){
        return true;
    }
    return false;
}

function checkReverseDiag(row, col, symbol, winNumber, size){
    //first I need to find a start point for search
    var r = row;
    var c = col;
    var steps = 0;
    while (r < size && c > 1 && steps < winNumber){
        r +=1;
        c -=1;
        steps += 1;
    }
    var count = 0;
    steps = 0;
    while(r > 0 && c <= size && count < winNumber && steps < 2*winNumber){
        if(board[r][c] == symbol){
            count += 1;
        }else{
            count = 0;
        }
        r -= 1;
        c += 1;
        steps += 1;
    }
    if (count >= winNumber){
        return true;
    }else{
        return false;
    }
}

//ask players if they want to save the unfinished game
//if yes, ask filename;
//calls saveData to save game data into a json file named as filename.
function askSave(filepath, numPlayers, playerName, nameToSymbol, winNumber, boardSize, totalMoves){
    console.log('\x1b[36m%s\x1b[0m', "Do you want to save this unfinished game[y/n]?\n");
    let saveGame = readlineSync.question('>> ');
    switch (saveGame){
        case 'y':
            console.log('\x1b[36m%s\x1b[0m', "The game will be saved in a json file, please assign a file name to the json file: \n");
            let fn = readlineSync.question('>> ');
            saveData(filepath, fn, numPlayers, playerName, nameToSymbol, winNumber, boardSize, totalMoves);
            break;
        case 'n':
            console.log('\x1b[36m%s\x1b[0m',"OK. GoodBye!");
            break;
        default:
            console.log('\x1b[33m%s\x1b[0m', "please type 'y' to save or 'n' to leave.\n");
            askSave(filepath, numPlayers, playerName, nameToSymbol, winNumber, boardSize, totalMoves);
            break;
    }
}

//save all related parameters and existing moves into a json file under the folder 'saved_games'.
function saveData(filepath, filename, numPlayers, playerName, nameToSymbol, winNumber, boardSize, totalMoves){
    dataToSave = {};
    dataToSave['numPlayers'] = numPlayers;
    dataToSave['boardSize'] = boardSize; 
    dataToSave['names'] = playerName;
    dataToSave['winNumber'] = winNumber;
    dataToSave['playerToSymbol'] = nameToSymbol;
    dataToSave['moveCount'] = totalMoves;
    dataToSave['board'] = board;
    let data = JSON.stringify(dataToSave);
    fs.writeFileSync(filepath + filename + '.json', data);
    console.log('\x1b[36m%s\x1b[0m',"Your game has been saved.\n");
    console.log(dataToSave);
}

/**
 * Branch 2 in @function startGame (choose 'no'):
 * if players choose to start a new game,
 * it calls @function askNumberOfPlayers() for input of number of players;
 * then it request names of players iteratively;
 * it calls @function sizeOfBoard() to get the board @param size;
 * it calls @function initGameBoard() to initialize a new @param board;
 * it calls @function winSequenceCount(@param size) to get @param winNumber, the size of a winning sequence of count;
 * at last it calls @function gameOnGoing() to start a new game.
 * the rest is the same as Branch 1.
 */

function askNumberOfPlayers(){
    console.log('\x1b[36m%s\x1b[0m', 'How many players are here for the game?\n The maximum number of players is 26.\n');
    var numPlayers = readlineSync.question('>> ');
    if (numPlayers > 0 && numPlayers <= 26){
        return numPlayers;
    }else{
        console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
        console.log('\x1b[36m%s\x1b[0m', '      The input value is invalid.\n');
        return askNumberOfPlayers();
    }
}

function sizeOfBoard(numPlayers){
    console.log('\x1b[36m%s\x1b[0m', 'For the size of the game board, please give me a number less or equal to 999.\n');
    var bSize = readlineSync.question('>> ');
    if(bSize > 0 && bSize <= 999 && bSize*bSize > (bSize - 1) * numPlayers && bSize*bSize > numPlayers){
        return bSize;
    }else{
        console.log('\x1b[31m%s\x1b[0m', 'ERROR: ');
        console.log('\x1b[36m%s\x1b[0m', '      The input value is invalid, or under the current board size, no player can win. Please try again.\n');
        return sizeOfBoard(numPlayers);
    }
}

//initialize a new board;
function initGameBoard(size){
    board = [[]];
    for (var i = 0; i <= size; i++){
        board[0].push(String(i));
    }
    for (var i = 0; i < size; i++){
        board.push([String(i+1)]);
        for (var j = 0; j < size; j++){
            board[i+1].push(' ');
        }
    }
    return board;
}

function winSequenceCount(size){
    flag = true;
    while(flag){
        console.log('\x1b[36m%s\x1b[0m', 'How many symbols are needed in a sequence to be treated as a final win? Pick a number less than or equal to the size of the board.\n');
        var winNumber = readlineSync.question('>> ');
        if(winNumber > 0 && winNumber <= size){
            flag = false;
            return winNumber;
        }
        console.log('\x1b[33m%s\x1b[0m', 'Sorry, you must choose a number <= the board size that you just chose, which is ' + size + '.\n');
        
    }
}

/**
 * Branch 3 in @function startGame() (choose 'quit'):
 * players quit without doing anything;
 * 
 * Branch 4 in @function startGame:
 * this is a defensive setting in case players types something meaningless.
 * it recursively redirects players to the beginning of @function startGame;
 */


/*
 * Drawing board functions
 * 
 */
function drawBoard(board){
    drawColIndex(board);
    for(var r_i = 1; r_i < board.length - 1; r_i++){
        drawBoardRow(board,r_i);
        drawCushion(board);
    }
    drawBoardRow(board,board.length-1);
}
function drawColIndex(board){
    var result = '';
    for(var i = 0; i < board[0].length; i++){
        if(i === 0){
            result += '   ';
        }else{
            result += ' ' + i + '  ';
        }
    }
    console.log(result);
}

function drawBoardRow(board, r_i){
    var result = '';
    for(var i = 0; i < board[r_i].length; i++){
        if(i === 0){
            result += board[r_i][i] + '  ';
        }else{
            result += ' ' + board[r_i][i] + ' |';
        }
    }
    console.log(result.substr(0,result.length -1));
}

//draw cushion seperating lines of board;
function drawCushion(board){
    var cushion = '   ';
    for(var i = 1; i < board.length; i++){
        cushion += '---+';
    }
    console.log(cushion.substr(0,cushion.length - 1));
}


/*
///////////////////////////////////////
function drawRowNumber(row){
    var line = ''
    for(var i = 0; i <= row; i++){
        if(i == 0) 
            line += '   ';
        else
            line += ' ' + i + '  ';
    }
    console.log(line);
}

function drawBars(n, row){
    var nextLine = n + '  ';
    for(var j = 1; j < row; j++){
        nextLine += '   |';
    }
    console.log(nextLine);
}
*/





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * some solved bugs for personal record
 * 
 * 
 * a failed case a:1 1, b: 2 2, a: 2 1, b: 3 1, a: 1 2, where it is failed
 * if(board[r][c] == symbol){
                    ^

TypeError: Cannot read property '1' of undefined
    at checkReverseDiag (/home/ning/Documents/JScodes/ttt.js:106:21)
    at checkWinner (/home/ning/Documents/JScodes/ttt.js:125:19)
    at startGame (/home/ning/Documents/JScodes/ttt.js:235:30)
    at Object.<anonymous> (/home/ning/Documents/JScodes/ttt.js:7:1)
    at Module._compile (module.js:573:30)
    at Object.Module._extensions..js (module.js:584:10)
    at Module.load (module.js:507:32)
    at tryModuleLoad (module.js:470:12)
    at Function.Module._load (module.js:462:3)
    at Function.Module.runMain (module.js:609:10)
    
solution: the culprit is JS ambiguous data type system.
*/

/*
 * 
 * color references for console.log output:
 * Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
when used, followed by %s\x1b[0m
*/