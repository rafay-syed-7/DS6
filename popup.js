//const durationInput = document.getElementById("duration");

const HoursInput = document.getElementById("hours");
const MinutesInput = document.getElementById("minutes");
const SecondsInput = document.getElementById("seconds");

const display = document.getElementById("timer");
const startBtn = document.getElementById("start");
// const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

//alarm sound
const alarmSound = document.getElementById("alarmSound");
let prevRemaining = null;
let uiInterval = null;

let alarmPlayed = false;
chrome.storage.local.get({ alarmPlayed: false }, ({ alarmPlayed: stored }) => {
  alarmPlayed = stored;
});

// whenever a tab-switch message arrives, clear the intro and show a quote:
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'tabSwitch') {
    const intro = document.getElementById('intro');
    if (intro && typeof getRandomQuote === 'function') {
     intro.textContent = getRandomQuote();
    }
  }
});


function combineFields(h, m, s) {
  return (h*3600 + m*60 + s) * 1000;
}


function formatTime(ms) {
  const totalSec = Math.floor(ms/1000);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec % 60;
  return [h,m,s]
    .map(n => n.toString().padStart(2,"0"))
    .join(":");
}

function render(state) {
  const { remaining, initialDuration, running } = state;

  // update display
  display.textContent = formatTime(remaining);

  // control enabling/disabling
  startBtn.disabled = running; // only disable if already running
  // stopBtn.disabled  = !running;
  resetBtn.disabled = !running 

  HoursInput.disabled = running;
  MinutesInput.disabled = running;
  SecondsInput.disabled = running;

  //play sound when time runs out 
  if (prevRemaining > 0 && remaining == 0) {
    if (!alarmPlayed) {
      alarmSound.play();
      alarmPlayed = true;
      chrome.storage.local.set({ alarmPlayed: true });
    }
  }
  //store for next tick
  prevRemaining = remaining;

  // keep ticking if running
  if (running && !uiInterval) {
    uiInterval = setInterval(() => {
      chrome.runtime.sendMessage({ action: "getState" }, render);
    }, 500);
  } else if (!running && uiInterval) {
    clearInterval(uiInterval);
    uiInterval = null;
  }
  
}

// function fetchState() {
//   chrome.runtime.sendMessage(
//     { action: "getState" }, 
//     state => {
//       if (!state.running && state.remaining === 0 && state.initialDuration > 0) {
//         alarmSound.play().catch(console.warn);
//       }
//       render(state);
//     }
//   );
// }

function fetchState() {
  chrome.storage.local.get(
    ["alarmTriggeredAt","lastAcknowledged"],
    ({ alarmTriggeredAt, lastAcknowledged }) => {

      //if new expiration not acknowledged
      if (
        alarmTriggeredAt &&
        alarmTriggeredAt !== lastAcknowledged
      ) {
        if (!alarmPlayed) {
          alarmSound.play();
          alarmPlayed = true;
          chrome.storage.local.set({ alarmPlayed: true });
        }

        // mark it acknowledged (don’t remove it)
        chrome.storage.local.set(
          { lastAcknowledged: alarmTriggeredAt },
          () => {
            // update UI
            chrome.runtime.sendMessage(
              { action: "getState" },
              render
            );
          }
        );
        return;
      }

      //normal path
      chrome.runtime.sendMessage(
        { action: "getState" },
        render
      );
    }
  );
}



// Start: validate input first, then send setDuration + start
startBtn.addEventListener("click", () => {
  //reset tracker
  prevRemaining = null;
  chrome.storage.local.set({ alarmPlayed: false });
  const hours = parseInt(HoursInput.value) || 0;
  const minutes = parseInt(MinutesInput.value) || 0;
  const seconds = parseInt(SecondsInput.value) || 0;

  const ms = combineFields(hours, minutes, seconds);
  if (ms <= 0) {
    alert("Please enter a valid time (HH:MM:SS) greater than 00:00:00.");
    return;
  }
  chrome.runtime.sendMessage({ action: "setDuration", duration: ms }, () => {
    chrome.runtime.sendMessage({ action: "start" }, fetchState);
  });

  //Change 'Welcome' message to a quote
  document.getElementById('intro').textContent = getRandomQuote();
});

// // Stop & Reset as before
// stopBtn.addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "stop" }, fetchState);
// });
resetBtn.addEventListener("click", () => {
  //clear tracker on reset
  prevRemaining = null;
  chrome.storage.local.set({ alarmPlayed: false });
  chrome.runtime.sendMessage({ action: "reset" }, fetchState);
});

document.addEventListener("DOMContentLoaded", () => {
  prevRemaining = null;
  fetchState();

  document.getElementById('intro').style.display = 'block';
  document.getElementById('quotes').textContent = '';

  chrome.storage.local.get('showQuote', ({ showQuote }) => {
    if (showQuote && typeof getRandomQuote === "function") {
      document.getElementById('quotes').textContent = getRandomQuote();
    }

    //resets quote flag
    chrome.storage.local.set({ showQuote: false });
  });
});