const firebaseConfig = {
    apiKey: "AIzaSyBy0gMpUTBPtN9PxScMJ4nPRItvXW6jEYE",
    authDomain: "pm-quiz-7159e.firebaseapp.com",
    projectId: "pm-quiz-7159e",
    storageBucket: "pm-quiz-7159e.appspot.com",
    messagingSenderId: "717677892",
    appId: "1:717677892:web:9db054b51d946d261ce311"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  const questions = [
    { 
      question: "What is PM full name", 
      options: ["Olumayowa Michael Odeyemi", "Oluwamayowa Michael Odeyemi", "Olamayowa Micheal Odeyemi ", "Michael Odeyemi"], 
      answer: "Olumayowa Michael Odeyemi" 
    },
    { 
      question: "Which city did PM grow up in?", 
      options: ["Oyo", "Ogbomoso", "osogbo", "Ibadan"], 
      answer: "Ibadan" 
    },
    {
      question: "What city was PM's first choice of university located in?",
      options: ["Abeokuta", "Liberia", "Ibadan", "Ghana"],
      answer: "Ghana"
    },
    {
        question: "What book,chapter and verse of the bible did God give to PM to start up RICC",
        options: ["Romans 12:4", "Isaiah 60:4", "Isaiah 61:2", "Isaiah 61:4"],
        answer: "Isaiah 61:4"
      },
      {
        question: "Why does PM keep his hair?",
        options: ["He likes it", "He is a jew", "He had a Dream", "He is a nazarene"],
        answer: "He is a nazarene"
      },
      {
        question: "What is the name of his favorite person?",
        options: ["Miss O", "Mrs O", "Mrs D", "Miss A"],
        answer: "Mrs O"
      },
      {
        question: "What Musical instrument does PM play?",
        options: ["Omele", "Drums", "Keyboard", "Gongon"],
        answer: "Gongon"
      },
      {
        question: "PM once said “Without…… our faith is vain",
        options: ["The resurrection of Christ", "The burial of Christ", "The ascension Christ", "The death of Christ"],
        answer: "The resurrection of Christ"
      },
      {
        question: "What book and chapter of the bible did PM received for his wedding",
        options: ["Matthew 21", "Matthew 22", "John 22", "Luke 10"],
        answer: "Matthew 22"
      },
      {
        question: "What month and date was PM's wedding?",
        options: ["November 21", "September 12", "September 20", "October 21"],
        answer: "October 21"
      },{
        question: "Our first three days of the month meeting is called?",
        options: ["Stand in the gap", "Stand in gap", "Stand on the gap", "Bid me to come"],
        answer: "Stand in gap"
      },{
        question: "How does PM usually start his sermons?",
        options: ["praise", "Prayer", "Worship", "Meditating"],
        answer: "Worship"
      },{
        question: "What was last Sunday sermon topic?",
        options: ["Living faith", "ascend", "The living faith", "The faith of the son of God 1"],
        answer: "The living faith"
      },{
        question: "What was RICC emphasis for last year?",
        options: ["Fruitful", "Alignment", "Righteousness", "Fruitfulness"],
        answer: "Fruitfulness"
      },{
        question: "What does Mama call PM",
        options: ["PM", "TM", "Pastor Michael", "Oddy"],
        answer: "TM"
      }

  ];
  
  let playerName = "";
  let playerId = null;
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let gameActive = false; // NEW: Track if game is active
  
  // NEW: Get additional DOM elements
  const startScreen = document.getElementById("start-screen");
  const waitingScreen = document.getElementById("waiting-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const scoreScreen = document.getElementById("score-screen");
  const endScreen = document.getElementById("end-screen");
  const questionText = document.getElementById("question-text");
  const optionsDiv = document.getElementById("options");
  const timerDiv = document.getElementById("timer");
  const currentScoreDisplay = document.getElementById("current-score");
  const playerStatus = document.getElementById("player-status");
  
  // NEW: Listen for game state changes from admin
  db.collection("gameControl").doc("admin").onSnapshot((doc) => {
    gameActive = doc.exists && doc.data().gameActive === true;
    updatePlayerStatus();
  });
  
  // NEW: Update player status based on game state
  function updatePlayerStatus() {
    if (gameActive) {
      // Game started - begin quiz
      waitingScreen.style.display = "none";
      quizScreen.style.display = "block";
      currentQuestion = 0;
      score = 0;
      showQuestion();
    } else if (waitingScreen.style.display === "block") {
      // Waiting for admin to start
      playerStatus.textContent = `Hello ${playerName}! Waiting for admin to start the game...`;
    }
  }
  
  // NEW: Register player when they enter name
  document.getElementById("start-btn").addEventListener("click", () => {
    playerName = document.getElementById("player-name").value.trim();
    if (playerName) {
      // Register as current player
      db.collection("currentPlayers").doc(playerName).set({
        name: playerName,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      startScreen.style.display = "none";
      waitingScreen.style.display = "block";
      updatePlayerStatus();
      initializeLiveScore();
    } else {
      alert("Please enter your name to join the quiz");
    }
  });
  function cleanupLiveScore() {
    if (playerName) {
      db.collection("liveScores").doc(playerName).delete()
        .then(() => console.log("Live score cleaned up for", playerName))
        .catch(error => console.error("Error cleaning up live score:", error));
    }
  }
  // NEW: Clean up when player leaves
  window.addEventListener("beforeunload", () => {
    if (playerName) {
      db.collection("currentPlayers").doc(playerName).delete();
    }
  });
  
  // Existing functions (slightly modified)
  function showQuestion() {
    const q = questions[currentQuestion];
    questionText.textContent = q.question;
    optionsDiv.innerHTML = "";
  
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.className = "option";
      btn.onclick = () => handleAnswer(opt);
      optionsDiv.appendChild(btn);
    });
  
    let timeLeft = 10;
    timerDiv.textContent = `Time left: ${timeLeft}s`;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = `Time left: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleAnswer(null);
      }
    }, 1000);
  }
  
  function handleAnswer(selected) {
    clearInterval(timer);
    
    const isCorrect = selected === questions[currentQuestion].answer;
    if (isCorrect) {
      score++;
    }
  
    quizScreen.style.display = "none";
    scoreScreen.style.display = "block";
    currentScoreDisplay.textContent = `${playerName}: ${score}`;
  
    updateLiveScore();
  
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }
  
  function updateLiveScore() {
    if (!playerName) return; // Ensure we have a player name
    
    // Create or update the player's live score
    db.collection("liveScores").doc(playerName).set({
      name: playerName,
      score: score,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }) // This merges with existing doc instead of overwriting
    .then(() => console.log("Live score updated for", playerName))
    .catch(error => {
      console.error("Error updating live score:", error);
      // Fallback: Store locally and try again later
      localStorage.setItem('pendingLiveScore', JSON.stringify({
        name: playerName,
        score: score,
        timestamp: new Date().toISOString()
      }));
    });
  }

  function initializeLiveScore() {
    db.collection("liveScores").doc(playerName).set({
      name: playerName,
      score: 0, // Initial score
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => console.log("Live score initialized for", playerName))
    .catch(error => console.error("Error initializing live score:", error));
  }
  
  function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion < questions.length) {
      quizScreen.style.display = "block";
      scoreScreen.style.display = "none";
      showQuestion();
    } else {
      submitScore();
    }
  }
  
  function submitScore() {
    updateLiveScore();
    cleanupLiveScore();
    
    db.collection("scores").add({
      name: playerName,
      score: score,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      if (playerId) {
        db.collection("liveScores").doc(playerId).delete();
        db.collection("currentPlayers").doc(playerName).delete();
      }
      quizScreen.style.display = "none";
      scoreScreen.style.display = "none";
      endScreen.style.display = "block";
      document.getElementById("score-message").textContent = `Thanks ${playerName}! Your final score: ${score}`;
    }).catch(error => {
      console.error("Error submitting score: ", error);
      quizScreen.style.display = "none";
      endScreen.style.display = "block";
      document.getElementById("score-message").textContent = `Thanks ${playerName}! Your final score: ${score}`;
    });
  }
  // Modify your handleAnswer function
function handleAnswer(selected) {
    clearInterval(timer);
    
    const isCorrect = selected === questions[currentQuestion].answer;
    if (isCorrect) {
      score++;
    }
  
    // Track answers
    db.collection("playerAnswers").doc(playerName).set({
      [currentQuestion]: {
        selected: selected,
        correct: isCorrect,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true })
    .catch(error => console.error("Error saving answer:", error));
  
    // Show the score screen
    quizScreen.style.display = "none";
    scoreScreen.style.display = "block";
    currentScoreDisplay.textContent = `${playerName}: ${score}`;
  
    updateLiveScore();
  
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  }
  
  // Add this when game starts
  function startGameForAll() {
    // Store questions in Firestore
    db.collection("gameQuestions").doc("current").set({
      questions: questions
    })
    .then(() => {
      // Clear previous answers
      db.collection("playerAnswers").get()
        .then(snapshot => {
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          return batch.commit();
        })
        .then(() => {
          // Start the game
          db.collection("gameControl").doc("admin").set({
            gameActive: true,
            startTime: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
    })
    .catch(error => {
      console.error("Error starting game:", error);
    });
  }