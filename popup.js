//const durationInput = document.getElementById("duration");

const HoursInput = document.getElementById("hours");
const MinutesInput = document.getElementById("minutes");
const SecondsInput = document.getElementById("seconds");

const display = document.getElementById("timer");
const startBtn = document.getElementById("start");
// const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

let uiInterval = null;

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

function fetchState() {
  chrome.runtime.sendMessage({ action: "getState" }, render);
}

// Start: validate input first, then send setDuration + start
startBtn.addEventListener("click", () => {

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
});

// // Stop & Reset as before
// stopBtn.addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "stop" }, fetchState);
// });
resetBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "reset" }, fetchState);
});

document.addEventListener("DOMContentLoaded", fetchState);
