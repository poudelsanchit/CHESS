const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const turnIndicator = document.getElementById("turnIndicator"); // Get turn indicator element

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  // Update turn indicator text
  turnIndicator.innerText = chess.turn() === 'w' ? 'White to move' : 'Black to move';

  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowindex;
      squareElement.dataset.column = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        // Check if square.type is defined
        if (square.type) {
          pieceElement.innerText = getPieceUnicode(square);
          pieceElement.draggable = playerRole === square.color;
          pieceElement.addEventListener("dragstart", (e) => {
            if (pieceElement.draggable) {
              draggedPiece = pieceElement;
              sourceSquare = { row: rowindex, col: squareindex };
              e.dataTransfer.setData("text/plain", "");
            }
          });
          pieceElement.addEventListener("dragend", () => {
            draggedPiece = null;
            sourceSquare = null;
          });
        } else {
          // Logging for Debugging
          console.warn("Undefined piece type at:", {
            row: rowindex,
            col: squareindex,
          });
        }

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.column),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  // Apply flipped class based on player role
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});
socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

renderBoard();
