//before doing all this, you need to make sure that you can get the board/ grid that represents the game we are playing
//and you can make the board move left, right, up, down by using console
//you can do these above by reading source code and try out before you actually start coding
function moveLeft_row(row) {
    row = row.filter(x => x !== 0);
    for (let i = 0; i < row.length -1; i++) {
        if (row[i] == row[i+1]) {
            row[i] *= 2;
            row[i+1] = 0;
        }
    }
    row = row.filter(x => x !== 0);
    while (row.length < 4) {
        row.push(0);
    }
    return row;
}

function moveRight_row(row){
    row = row.filter(x => x !== 0);
    for (let i = row.length -1; i >= 0; i--) {
        if (row[i] == row[i-1]) {
            row[i] *= 2;
            row[i-1] = 0;
        }
    }
    row = row.filter(x => x !== 0);
    while (row.length < 4) {
        row.unshift(0);
    }
    return row;
}

function moveLeft(board){
    for (let i = 0; i < board.length; i++) {
        let col = [];
        for (let j = 0; j < board.length; j++){
            col.push(board[j][i]);
        }
        col = moveLeft_row(col);
        for (let j = 0; j < board.length; j++){
            board[j][i] = col[j];
        }
    }
    return board;
}

function moveUp(board) {
    for (let i = 0; i < board.length; i ++) {
        let row = board[i];
        new_row = moveLeft_row(row);
        for (let j = 0; j < row.length; j++) {
            board[i][j] = new_row[j];
        }
    }
    return board;
}

function moveRight(board) {
    for (let i = 0; i < board.length; i++){
        let col =[];
        for (let j = 0; j < board.length; j++){
            col.push(board[j][i]);
        }
        col = moveRight_row(col);
        for (let j = 0; j < board.length; j++){
            board[j][i] = col[j];
        }
    }
    return board;
}

function moveDown(board) {
    for (let i = 0; i < board.length; i ++) {
        let row = board[i];
        new_row = moveRight_row(row);
        for (let j = 0; j < row.length; j++) {
            board[i][j] = new_row[j];
        }
    }
    return board;
}

function getBoard(){
    const temp = JSON.parse(localStorage.getItem("gameState")).grid.cells;
    let board = [];
    for (let i = 0; i < temp.length; i++){
        board[i] = [];
        for (let j = 0; j < temp.length; j++) {
            board[i][j] = temp[i][j]?.value || 0;
        }
    }
    return board;
}
//a function that spots valid move, or else the expectimax will waste time consider moves that doesnt change the board 
//do it easily by executing that move, then compare the previous board with current board 

function sameBoard(pre, curr) {
    return JSON.stringify(pre) == JSON.stringify(curr);
}

const keyMap = new Map([
        ["up",moveUp],
        ["down", moveDown],
        ["left", moveLeft],
        ["right", moveRight]
    ]);

function validMove(board) {
    let valid_move = [];
    for (let [name, fn] of keyMap){
        let copy = structuredClone(board);
        fn(copy);
        if (!sameBoard(board, copy)){
            valid_move.push([name, fn]);
        }
    }
    return valid_move;
}


function emptyCells(board) {
    let empty = [];
    for (let x = 0; x < board.length; x++){
        for (let y = 0; y < board.length; y++){
            if (board[x][y] == 0){
                empty.push([x,y]);
            }
        }
    }
    return empty;
}

const weight = [
    [65536,32768,16384,8192],
    [2048,4096,8192,16384],
    [1024,512,256,128],
    [2,4,8,16]
]
//also need a function to check if the board is following the snake structure 
function snakeScore(board){
    let score = 0;
    for (let x = 0; x < board.length; x++){
        for (let y = 0; y < board.length; y++){
            score += board[x][y] * weight[x][y];
        }
    }
    return score;
}

//this works as 2 factor authentication, i dont care how the snake structure is working
//if the largest tile left the corner, it is bad 
function maxCorner(board){
    let maxTile = 0;
    for (const row of board){
        for (const val of row){
            if (val > maxTile) {
                maxTile = val;
            }
        }
    }
    return board[0][0] == maxTile ? 1 : 0;
}

// define how we evaluate move, we will score if the board is following snake structure and its amount of empty space 
function evaluate(board){
    return snakeScore(board) + maxCorner(board) * 100000 + emptyCells(board).length * 100000;
}

//will later make bestMove depth 2 as it will both evaluate
//Player move
//chance node
function chanceNode(board, depth){
    //as we know from the source code that 90% will 2 spawn, and 10% for 4 
    //use expected value formula in this place 
    //in short, we are calculating what score will we get even if the game spawn things randomly   
    if (depth <= 0){
        return evaluate(board);
    } 
    let empties = emptyCells(board);
    
    if (empties.length === 0){
        return evaluate(board);
    }

    let expected = 0;

    for (let [r,c] of empties){
        let copy2 = structuredClone(board);
        copy2[r][c] = 2;

        expected += (0.9 / empties.length * expectimax(copy2, depth -1 ));

        let copy4 = structuredClone(board);
        copy4[r][c] = 4;
        expected += (0.1 / empties.length * expectimax(copy4, depth -1 ));
    }
    return expected;
}
//depth2 best move 
//looks the same as depth1, we just change evaluate directly to chanceNode
function bestMove(board){
    let bestScore = -Infinity;
    let bestMove = null;
   
    for (const [name, fn] of validMove(board)) {
        let copy = structuredClone(board);
        fn(copy);
        let score = chanceNode(copy, 2); //as we will go 2 steps ahead, 3 is quiet too much :v
        if (score > bestScore){
            bestScore = score;
            bestMove = name;
        }
    }
    return bestMove;
}

//expectimax code
//expectimax responsible for moving tiles  
//chanceNode responsible for taking random node spawn in account
//that's why they are linked together, called after each other
function expectimax(board, depth){
    if (depth <= 0){
        return evaluate(board);
    }

    let moves = validMove(board);
    if (moves.length == 0){
        return evaluate(board);
    }

    let best = -Infinity;
    for (let [name, fn] of moves){
        let copy = structuredClone(board);
        fn(copy);

        best = Math.max(best, chanceNode(copy, depth));
        //since chanceNode and expectimax should happend at the same time, decrease it after 1 call, not both 
    }

    return best;
}

// number associates to each arrow key 
const keyMove = {
    up:38,
    down:40,
    left:37,
    right:39
}
//one thing i dont know abt javascript is that you can set a timely function 
//which will run for every "time"
const bot = setInterval(() => {
    if (!localStorage.getItem("gameState")){
        clearInterval(bot);
        return;
    }

    let board = getBoard();
    let best = bestMove(board);

    if (!best){
        clearInterval(bot);
        return;
    }
    let key = keyMove[best];
    document.dispatchEvent(new KeyboardEvent(
        "keydown", {
            which:key,
            keyCode:key,
            bubbles:true
        }
    ))
}, 100); // so this one will run for every 100ms

