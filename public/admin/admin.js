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
  
  // Admin controls
  const startGameBtn = document.getElementById("start-game-btn");
  const gameStatus = document.getElementById("game-status");
  const currentPlayersDiv = document.getElementById("current-players");
  const leaderboardBody = document.getElementById("leaderboard-body");
  const liveScoresBody = document.getElementById("live-scores-body");
  
  // Track game state
  let gameActive = false;
  
  function setupLiveScores() {
    const liveScoresBody = document.getElementById("live-scores-body");
    
    db.collection("liveScores")
      .orderBy("score", "desc")
      .onSnapshot(
        (snapshot) => {
          liveScoresBody.innerHTML = "";
          
          if (snapshot.empty) {
            liveScoresBody.innerHTML = `
              <tr>
                <td colspan="2">No active players right now</td>
              </tr>
            `;
            return;
          }
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");
            
            // Highlight the row if score was recently updated
            const isRecent = new Date() - new Date(data.lastUpdated?.toDate() || data.joinedAt?.toDate()) < 5000;
            if (isRecent) row.classList.add("recent-update");
            
            row.innerHTML = `
              <td>${data.name}</td>
              <td>${data.score}</td>
            `;
            liveScoresBody.appendChild(row);
          });
        },
        (error) => {
          console.error("Live scores error:", error);
          liveScoresBody.innerHTML = `
            <tr>
              <td colspan="2">Error loading live scores</td>
            </tr>
          `;
        }
      );
  }

  // Initialize game control
  db.collection("gameControl").doc("admin").onSnapshot((doc) => {
    gameActive = doc.exists && doc.data().gameActive === true;
    updateGameStatus();
  });
  
  // Update UI based on game state
  function updateGameStatus() {
    if (gameActive) {
      gameStatus.textContent = "Game Status: IN PROGRESS";
      gameStatus.style.color = "#28a745";
      startGameBtn.textContent = "End Game";
      startGameBtn.style.backgroundColor = "#dc3545";
    } else {
      gameStatus.textContent = "Game Status: Waiting to start...";
      gameStatus.style.color = "#6c757d";
      startGameBtn.textContent = "Start Game";
      startGameBtn.style.backgroundColor = "#28a745";
    }
  }
  
  // Start/End game button
  startGameBtn.addEventListener("click", () => {
    if (gameActive) {
      db.collection("gameControl").doc("admin").delete();
    } else {
      db.collection("gameControl").doc("admin").set({
        gameActive: true,
        startTime: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  
  // Track current players
  db.collection("currentPlayers").onSnapshot((snapshot) => {
    currentPlayersDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const player = doc.data();
      const playerTag = document.createElement("div");
      playerTag.className = "player-tag";
      playerTag.textContent = player.name;
      currentPlayersDiv.appendChild(playerTag);
    });
  });
  
  // Leaderboard (permanent scores)
  db.collection("scores")
    .orderBy("score", "desc")
    .limit(20)
    .onSnapshot(snapshot => {
      leaderboardBody.innerHTML = "";
      snapshot.forEach(doc => {
        const { name, score } = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `<td>${name}</td><td>${score}</td>`;
        leaderboardBody.appendChild(row);
      });
    });
  
  // Live scores
  db.collection("liveScores")
    .orderBy("score", "desc")
    .onSnapshot(snapshot => {
      liveScoresBody.innerHTML = "";
      snapshot.forEach(doc => {
        const { name, score } = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `<td>${name}</td><td>${score}</td>`;
        liveScoresBody.appendChild(row);
      });
    });

    document.addEventListener("DOMContentLoaded", () => {
        setupLiveScores();
      });

      // Add these with your other variables
const gameReviewSection = document.getElementById("game-review");
const questionsList = document.getElementById("questions-list");
const answerStatsDiv = document.getElementById("answer-stats");
const hideReviewBtn = document.getElementById("hide-review");
const exportJsonBtn = document.getElementById("export-json");
const exportCsvBtn = document.getElementById("export-csv");

let gameQuestions = [];
let playerAnswers = {};

// Add this after Firebase initialization
function loadQuestionsAndAnswers() {
  // Load questions
  db.collection("gameQuestions").doc("current").get()
    .then(doc => {
      if (doc.exists) {
        gameQuestions = doc.data().questions;
        console.log("Questions loaded:", gameQuestions);
      }
    })
    .catch(error => {
      console.error("Error loading questions:", error);
    });

  // Load player answers
  db.collection("playerAnswers").get()
    .then(snapshot => {
      playerAnswers = {};
      snapshot.forEach(doc => {
        playerAnswers[doc.id] = doc.data();
      });
      console.log("Player answers loaded:", playerAnswers);
    })
    .catch(error => {
      console.error("Error loading player answers:", error);
    });
}

// Call this when admin ends the game
function showGameReview() {
  if (gameQuestions.length === 0) {
    console.warn("No questions to review");
    return;
  }

  // Show questions and correct answers
  questionsList.innerHTML = "";
  gameQuestions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-item";
    
    questionDiv.innerHTML = `
      <div class="question-text">Q${index + 1}: ${q.question}</div>
      <div>Options: ${q.options.join(", ")}</div>
      <div class="correct-answer">Correct Answer: ${q.answer}</div>
    `;
    
    questionsList.appendChild(questionDiv);
  });

  // Show answer statistics
  showAnswerStats();

  gameReviewSection.style.display = "block";
}

function showAnswerStats() {
  answerStatsDiv.innerHTML = "";

  gameQuestions.forEach((q, qIndex) => {
    const stats = {
      total: 0,
      correct: 0,
      options: {}
    };

    q.options.forEach(opt => {
      stats.options[opt] = 0;
    });

    // Count answers
    Object.values(playerAnswers).forEach(player => {
      if (player[qIndex]) {
        stats.total++;
        stats.options[player[qIndex].selected]++;
        if (player[qIndex].correct) stats.correct++;
      }
    });

    // Create stats display
    const statsDiv = document.createElement("div");
    statsDiv.className = "answer-stats-item";
    
    const correctPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    
    statsDiv.innerHTML = `
      <div class="question-text">Q${qIndex + 1}: ${q.question}</div>
      <div>Correct answers: ${correctPercentage}% (${stats.correct}/${stats.total})</div>
      <div class="stat-bar">
        <div class="stat-bar-fill" style="width: ${correctPercentage}%"></div>
      </div>
      <div style="margin-top: 0.5rem;">Answer distribution:</div>
    `;

    // Add option percentages
    q.options.forEach(opt => {
      const count = stats.options[opt] || 0;
      const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      statsDiv.innerHTML += `
        <div>${opt}: ${percent}% (${count})</div>
      `;
    });

    answerStatsDiv.appendChild(statsDiv);
  });
}

// Export functions
function exportAsJson() {
  const data = {
    questions: gameQuestions,
    answers: playerAnswers,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quiz-results-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function exportAsCsv() {
  let csv = "Question,Correct Answer,Player,Selected Answer,Correct?\n";
  
  gameQuestions.forEach((q, qIndex) => {
    Object.entries(playerAnswers).forEach(([playerName, answers]) => {
      if (answers[qIndex]) {
        csv += `"${q.question.replace(/"/g, '""')}",` +
               `"${q.answer.replace(/"/g, '""')}",` +
               `"${playerName.replace(/"/g, '""')}",` +
               `"${answers[qIndex].selected.replace(/"/g, '""')}",` +
               `${answers[qIndex].correct ? "Yes" : "No"}\n`;
      }
    });
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quiz-results-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// Event listeners
hideReviewBtn.addEventListener("click", () => {
  gameReviewSection.style.display = "none";
});

exportJsonBtn.addEventListener("click", exportAsJson);
exportCsvBtn.addEventListener("click", exportAsCsv);

// Modify your endGame function
function endGame() {
  db.collection("gameControl").doc("admin").delete()
    .then(() => {
      loadQuestionsAndAnswers();
      setTimeout(showGameReview, 1000); // Give a second to load data
    })
    .catch(error => {
      console.error("Error ending game:", error);
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadQuestionsAndAnswers();
  // ... rest of your existing initialization
});