$(document).ready(function() {
    var database = firebase.database();
    var isPlayer1 = false;
    var isPlayer2 = false;

    var dbKeys = ["chatlog", "game", "player1", "player2"];

    var dbRef = database.ref();

    dbRef.once("value", function(snapshot) {
        if(!isPlayer1 && !isPlayer2) {
            var items = snapshot.val();
            if(items[dbKeys[2]].player1Joined === false) {
                console.log("p1 join");
                database.ref(dbKeys[2]).set({
                    player1Joined: true,
                    player1Guess: "",
                    player1Points: 0
                });
                isPlayer1 = true;
                database.ref("/chatlog").set({
                    msg0: "Player 1 joined the lobby."
                });
                database.ref("/chatInfo").set({
                    numMessages: 0
                });
                if(items[dbKeys[3]].player2Joined === true) {
                    console.log("Game on");
                    database.ref("/game/gameState").set(true);
                }
            } else if(items[dbKeys[3]].player2Joined === false) {
                console.log("p2 join");
                database.ref(dbKeys[3]).set({
                    player2Joined: true,
                    player2Guess: "",
                    player2Points: 0
                });
                isPlayer2 = true;
                database.ref("/chatlog").set({
                    msg0: "Player 2 joined the lobby."
                });
                database.ref("/chatInfo").set({
                    numMessages: 0
                });
                if(items[dbKeys[2]].player1Joined === true) {
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
                    player1Points: 0
                });
                database.ref("/game/gameState").onDisconnect().set(false);
                database.ref("/chatlog").onDisconnect().set({
                    msg0: "Player 1 left the lobby."
                });
                database.ref("/chatInfo").set({
                    numMessages: 0
                });
                $("#player").text("You are Player 1!");
            } else if(isPlayer2) {
                var p2Ref = database.ref(dbKeys[3]);
                p2Ref.onDisconnect().set({
                    player2Joined: false,
                    player2Guess: "",
                    player2Points: 0
                });
                database.ref("/game/gameState").onDisconnect().set(false);
                database.ref("/chatlog").onDisconnect().set({
                    msg0: "Player 2 left the lobby."
                });
                database.ref("/chatInfo").set({
                    numMessages: 0
                });
                $("#player").text("You are Player 2!");
            } else {
                $("#player").text("You are spectating! (Lobby is full)");
            }
        }
        // If any errors are experienced, log them to console.
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    // Global Variables
    var lockedIn = true;
    var chatTotal = 0;

    // Node object for RPS Linked List
    class Node { 
        constructor(element) { 
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
        // $("#chat-messages").append($("#chat").val());
        // $("#chat-messages").append($("<br>"));
        database.ref("/chatInfo/numMessages").set(chatTotal + 1);
        if(isPlayer1) {
            addMessage("Player 1: " + $("#chat").val());
        } else if(isPlayer2) {
            addMessage("Player 2: " + $("#chat").val());            
        } else {
            addMessage("Spectator: " + $("#chat").val());
        }
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
        if(!lockedIn) {
            if(isPlayer1) {
                guessHelper(choice);
            } else if(isPlayer2) {
                guessHelper(choice);
            } else {
                console.log("You're a spectator. You can't guess!");
            }
        }
    }

    function guessHelper(choice) {
        var newImage = $("<img src='assets/images/" + choice + ".png' alt='Player Guess' class='player-choice'/>");
        if(isPlayer1) {
            database.ref("/player1/player1Guess").set(choice);
            newImage.attr("id", "player-1-choice");
            $("#player-1-choice").remove();
            $("#p1-guess").append(newImage);
        } else {
            database.ref("/player2/player2Guess").set(choice);
            newImage.attr("id", "player-2-choice");
            $("#player-2-choice").remove();
            $("#p2-guess").append(newImage);
        }
        lockedIn = true;
    }

    function addMessage(message) {
        var referenceStr = "/chatlog/msg" + (chatTotal);
        database.ref(referenceStr).set(message);
    }

    function gameOver(winner) {
        if(winner === 1) {
            if(isPlayer1) {
                console.log("You win!");
            } else if(isPlayer2) {
                console.log("You lose...");
            } else {
                console.log("Player 1 wins!");
            }
        } else if(winner === 2){
            if(isPlayer1) {
                console.log("You lose...");
            } else if(isPlayer2) {
                console.log("You win!");
            } else {
                console.log("Player 2 wins!");
            }
        } else {
            console.log("It's a draw!");
        }
    }

    // When something changes in the DB, run this function
    dbRef.on("value", function(snapshot) {
        var items = snapshot.val();
        console.log("Item changed");
        
        console.log("Game State: " + items[dbKeys[1]].gameState);
        if(items[dbKeys[1]].gameState === true) {
            if(isPlayer1 && items[dbKeys[2]].player1Guess === "") {
                console.log("Player 1 can Guess");
                lockedIn = false;
            }

            if(isPlayer2 && items[dbKeys[3]].player2Guess === "") {
                console.log("Player 2 can Guess");
                lockedIn = false;
            }
            chatTotal = items["chatInfo"].numMessages;

            // Handler for when both players have guessed
            if(items[dbKeys[2]].player1Guess !== "" && items[dbKeys[3]].player2Guess !== "") {

                items[dbKeys[1]].gameState = false;

                $("#submit").attr("disabled", "disabled");
                // Assign users' guesses to one of the RPS ListNodes
                var oneNode = null;
                if(items[dbKeys[2]].player1Guess === "r") {
                    oneNode = rockNode;
                } else if(items[dbKeys[2]].player1Guess === "p") {
                    oneNode = paperNode;
                } else {
                    oneNode = scissorsNode;
                }

                var twoNode = null;
                if(items[dbKeys[3]].player2Guess === "r") {
                    twoNode = rockNode;
                } else if(items[dbKeys[3]].player2Guess === "p") {
                    twoNode = paperNode;
                } else {
                    twoNode = scissorsNode;
                }

                $("#player-1-choice").remove();
                $("#player-2-choice").remove();
                var newImage1 = $("<img src='assets/images/" + oneNode.element.substring(0, 1) + ".png' alt='Player Guess' class='player-choice' id='player-1-choice'/>");
                var newImage2 = $("<img src='assets/images/" + twoNode.element.substring(0, 1) + ".png' alt='Player Guess' class='player-choice' id='player-2-choice'/>");
                $("#p1-guess").append(newImage1);
                $("#p2-guess").append(newImage2);

                // Compare guesses using ListNode links
                if(oneNode.element === twoNode.element) {
                    gameOver(0);
                } else if(oneNode.next.element === twoNode.element) {
                    gameOver(2);
                } else if(twoNode.next.element === oneNode.element) {
                    gameOver(1);
                }

                // !!!!!!!TODO!!!!!!! 
                // Print "You Win/You Lose/Player Wins"
                // Update Wins/Losses tally
                
                waitAndReset();
            }
        }
        
        // Player 1 has left.
        if(items[dbKeys[2]].player1Joined === false && isPlayer2) {
            console.log("p1 is not here");
            database.ref(dbKeys[3]).set({
                player2Joined: true,
                player2Guess: "",
                player2Points: 0
            });
            lockedIn = true;
            chatTotal = 0;
            $(".player-choice").remove();
        }

        // Player 2 has left.
        if(items[dbKeys[3]].player2Joined === false && isPlayer1) {
            console.log("p2 is not here");
            database.ref(dbKeys[2]).set({
                player1Joined: true,
                player1Guess: "",
                player1Points: 0
            });
            lockedIn = true;
            chatTotal = 0;
            $(".player-choice").remove();
        }

        if(items[dbKeys[3]].player2Joined === false && !isPlayer1 || items[dbKeys[2]].player1Joined === false && !isPlayer2) {
            chatTotal = 0;
            $(".player-choice").remove();
        }

        $("#chat-messages").empty();
        for(var i = 0; i <= chatTotal; i++) {           
            var key = "msg" + i;
            var message = items["chatlog"][key];
            
            $("#chat-messages").append("<span>" + message + "</span>");
            $("#chat-messages").append($("<br>"));
        }
        // If any errors are experienced, log them to console.
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function waitAndReset() {
        await sleep(5000);
        console.log("After 5 seconds.");

        // Reset the game
        lockedIn = false;
        $(".player-choice").remove();
        database.ref("/game/gameState").set(true);
        database.ref("/player1/player1Guess").set("");
        database.ref("/player2/player2Guess").set("");
    }
});