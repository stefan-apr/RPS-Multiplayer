$(document).ready(function() {
    var database = firebase.database();
    var isPlayer1 = false;
    var isPlayer2 = false;

    var dbKeys = ["chatlog", "game", "player1", "player2"];

    var dbRef = database.ref();

    dbRef.once("value", function(snapshot) {
        var items = snapshot.val();
        console.log("Init");
        console.log(items);

        if(items[dbKeys[2]].player1Joined === false) {
            console.log("p1 join");
            database.ref(dbKeys[2]).set({
                player1Joined: true,
                player1Guess: ""
            });
            isPlayer1 = true;
            // How do I get this particular value????
            console.log(database.ref("/player2/player2Joined"));
            if(database.ref("/player2/player2Joined") === true) {
                console.log("Game on");
                database.ref("/game/gameState").set(true); 
            }
        } else if(items[dbKeys[3]].player2Joined === false) {
            console.log("p2 join");
            database.ref(dbKeys[3]).set({
                player2Joined: true,
                player2Guess: ""
            });
            isPlayer2 = true;
            console.log(database.ref("/player1/player1Joined"));
            if(database.ref("/player1/player1Joined") === true) {
                console.log("Game on");
                database.ref("/game/gameState").set(true); 
            }
        } else {
            console.log("The lobby is full right now. Try again later.");
        }

        if(isPlayer1) {
            var p1Ref = database.ref(dbKeys[2]);
            p1Ref.onDisconnect().set({
                player1Joined: false,
                player1Guess: "",
            });
            database.ref("/game/gameState").onDisconnect().set(false);
        } else if(isPlayer2) {
            var p2Ref = database.ref(dbKeys[3]);
            p2Ref.onDisconnect().set({
                player2Joined: false,
                player2Guess: "",
            });
            database.ref("/game/gameState").onDisconnect().set(false);
        }
        // If any errors are experienced, log them to console.
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    // Global Variables
    var lockedIn = true;
    var p1Points = 0;
    var p2Points = 0;
    var ties = 0;

    // User defined class node (for Linked List)
    class Node { 
        // constructor 
        constructor(element) 
        { 
            this.element = element;
            this.next = null
        } 
    } 

    // One ListNode for each RPS possibility
    var rockNode = new Node("rock");
    var paperNode = new Node("paper");
    var scissorsNode = new Node("scissors");

    // Establish circular list
    rockNode.next = paperNode;
    paperNode.next = scissorsNode;
    scissorsNode.next = rockNode;

    $("#submit").click(function() {
        $("#chat-messages").append($("#chat").val());
        $("#chat-messages").append($("<br>"));
    });

    $("#r").click(function() {
        guess("r");
    });

    $("#p").click(function() {
        guess("p");
    });

    $("#s").click(function() {
        guess("s");
    });

    function guess(choice) {
        if(database.ref("/game/gameState") === true) {
            if(isPlayer1) {
                console.log("Guessed " + choice);
                database.ref("/player1/player1Guess").set(choice);
            } else if(isPlayer2) {
                console.log("Guessed " + choice);
                database.ref("/player2/player2Guess").set(choice);
            } else {
                console.log("You're a spectator. You can't guess!");
            }
        }
    }

    // When something changes in the DB, run this function
    dbRef.on("value", function(snapshot) {
        var items = snapshot.val();
        console.log("Item changed");
        
        if(items[dbKeys[1]].gameState === true) {
            // Player 1 has left. Player 2 (or any spectator) is responsible for cleaning up chat and resetting guesses.
            if(items[dbKeys[2]].player1Joined === false) {
                console.log("p1 left");
                database.ref(dbKeys[2]).set({
                    player1Joined: false,
                    player1Guess: ""
                });
                database.ref("/player2/player2Guess").set("");
            }

            // Player 2 has left. Player 1 (or any spectator) is responsible for cleaning up chat and resetting guesses.
            if(items[dbKeys[3]].player2Joined === false) {
                console.log("p2 left");
                database.ref(dbKeys[3]).set({
                    player2Joined: false,
                    player2Guess: ""
                });
                database.ref("/player1/player1Guess").set("");                
            }
        } else {

        }
        // If any errors are experienced, log them to console.
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    
    /*
    while(gameState) {
    var valid = false;
    var p1HasGuessed = false;
    while(!valid) {
        oneGuess = prompt("Player 1, please guess r, p, or s");
        // Check if user entered r, p, or s
        if(validChoices.indexOf(oneGuess) === -1) {
        alert("That's not a valid choice. Pick r, p, or s")
        } else {
        valid = true;
        }
    }
    // Assign user's guess to one of the RPS ListNodes
    var oneNode = null;
    if(oneGuess === "r") {
        oneNode = rockNode;
    } else if(oneGuess === "p") {
        oneNode = paperNode;
    } else {
        oneNode = scissorsNode;
    }

    // Begin Player 2's turn
    valid = false;
    while(!valid) {
        twoGuess = prompt("Player 2, please guess r, p, or s");
        //Check if user entered r, p, or s
        if(validChoices.indexOf(twoGuess) === -1) {
        alert("That's not a valid choice. Pick r, p, or s")
        } else {
        valid = true;
        }
    }
    // Assign user's guess to one of the RPS ListNodes
    var twoNode = null;
    if(twoGuess === "r") {
        twoNode = rockNode;
    } else if(twoGuess === "p") {
        twoNode = paperNode;
    } else {
        twoNode = scissorsNode;
    }
    
    // Compare guesses using ListNode links
    if(oneGuess === twoGuess) {
        ties++;
        alert("Looks like a tie!");
    } else if(oneNode.next.element === twoNode.element) {
        p2Points++;
        alert("Player 2 wins! They have " + p2Points + " points!");
    } else if(twoNode.next.element === oneNode.element) {
        p1Points++;
        alert("Player 1 wins! They have " + p1Points + " points!");
    }
    // Print statistics
    if(!confirm("Would you like to play again?")) {
        document.write("Thank you for playing!" + "<br>");
        document.write("Final Scores:" + "<br>");
        document.write("Player 1: " + p1Points + "<br>");
        document.write("Player 2: " + p2Points + "<br>");
        document.write("Total ties: " + ties + "<br>");
        if(p1Points > p2Points) {
        document.write("Player 1 wins overall!");
        } else if(p2Points > p1Points) {
        document.write("Player 2 wins overall!");
        } else {
        document.write("It's a draw overall!");
        }
        gameState = false;
    }
    }
    */
});