// Importa el módulo express para crear el servidor web
const express = require('express');
// Inicializa la aplicación express
const app = express();
// Define el puerto en el que se ejecutará el servidor
const PORT = 3000;

// Middleware para permitir recibir JSON en las peticiones POST
app.use(express.json()); // Para leer JSON en POST

// ===============================
// 🔹 Utilidades de Tablero
// ===============================

// Combinaciones ganadoras posibles en el tablero de Ta-Te-Ti
const WINS = [
    [0,1,2],[3,4,5],[6,7,8], // filas
    [0,3,6],[1,4,7],[2,5,8], // columnas
    [0,4,8],[2,4,6]          // diagonales
];

// Función para verificar si hay un ganador en el tablero
function checkWinner(board) {
    for (const [a,b,c] of WINS) {
        if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 1 o 2
        }
    }
    return board.includes(0) ? null : 0; // null = sigue, 0 = empate
}

// Detecta qué jugador debe jugar según el estado actual del tablero
function detectPlayer(board) {
    const xCount = board.filter(v => v === 1).length;
    const oCount = board.filter(v => v === 2).length;
    return xCount <= oCount ? 1 : 2;
}

// Imprime el tablero en consola de forma visual
function printBoard(board) {
    const symbols = board.map(v => v === 0 ? ' ' : v === 1 ? 'X' : 'O');
    console.log(`
 ${symbols[0]} | ${symbols[1]} | ${symbols[2]}
---+---+---
 ${symbols[3]} | ${symbols[4]} | ${symbols[5]}
---+---+---
 ${symbols[6]} | ${symbols[7]} | ${symbols[8]}
`);
}

// ===============================
// 🔹 Lógica Minimax con poda alfa-beta
// ===============================

// Algoritmo Minimax para encontrar el mejor movimiento, con poda alfa-beta
function minimax(board, depth, isMax, player, opponent, alpha, beta) {
    const result = checkWinner(board);
    if (result !== null) {
        if (result === player) return 10 - depth;
        if (result === opponent) return depth - 10;
        return 0;
    }

    if (isMax) {
        let maxEval = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === 0) {
                board[i] = player;
                const evalScore = minimax(board, depth + 1, false, player, opponent, alpha, beta);
                board[i] = 0;
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // poda
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === 0) {
                board[i] = opponent;
                const evalScore = minimax(board, depth + 1, true, player, opponent, alpha, beta);
                board[i] = 0;
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // poda
            }
        }
        return minEval;
    }
}

// Calcula el mejor movimiento posible para el jugador actual
function bestMove(board, player) {
    const opponent = player === 1 ? 2 : 1;
    let move = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
        if (board[i] === 0) {
            board[i] = player;
            const score = minimax(board, 0, false, player, opponent, -Infinity, Infinity);
            board[i] = 0;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

// ===============================
// 🔹 Middleware para validar tablero
// ===============================

// Middleware para validar que el tablero recibido es correcto
function validateBoard(req, res, next) {
    const board = req.method === 'GET' 
        ? req.query.board?.split(',').map(Number)
        : req.body.board;

    if (!board || !Array.isArray(board) && req.method === 'POST') {
        return res.status(400).json({ error: 'Falta el tablero.' });
    }

    if (board.length !== 9 || board.some(isNaN)) {
        return res.status(400).json({ error: 'El tablero debe tener 9 posiciones válidas.' });
    }

    req.board = board;
    next();
}

// ===============================
// 🔹 Endpoints
// ===============================

// Endpoint raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor de Ta-Te-Ti del Grupo Sin Nombre funcionando. Usa /move con GET o POST.');
});

// Endpoint GET para realizar un movimiento en el tablero
app.get('/move', validateBoard, (req, res) => {
    const player = detectPlayer(req.board);
    const move = bestMove(req.board, player);
    req.board[move] = player;
    printBoard(req.board);
    res.json({ movimiento: move, tablero: req.board });
});

// Endpoint POST para realizar un movimiento en el tablero
app.post('/move', validateBoard, (req, res) => {
    const player = detectPlayer(req.board);
    const move = bestMove(req.board, player);
    req.board[move] = player;
    printBoard(req.board);
    res.json({ movimiento: move, tablero: req.board });
});

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor de Ta-Te-Ti escuchando en http://localhost:${PORT}`);
});
