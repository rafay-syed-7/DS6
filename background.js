// persistent keys
const KEYS = ["initialDuration","remaining","endTime","running"];

let state = {
  initialDuration: 0,  // ms originally set
  remaining:       0,  // ms left
  endTime:         null, // timestamp when it should hit zero
  running:         false
};

function loadState() {
  chrome.storage.local.get(KEYS, data => {
    state.initialDuration = data.initialDuration || 0;
    state.remaining       = data.remaining       || 0;
    state.endTime         = data.endTime ?? null;
    state.running         = data.running         || false;

    // if it was running but already expired, clamp to zero
    if (state.running && Date.now() >= state.endTime) {
      state.running   = false;
      state.remaining = 0;
      state.endTime   = null;
      saveState();
    }
  });
}

function saveState() {
  chrome.storage.local.set(state);
}

chrome.runtime.onInstalled.addListener(loadState);
chrome.runtime.onStartup.addListener(loadState);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const now = Date.now();

  switch (msg.action) {

    case "setDuration":
      // user typed in a new time
      state.initialDuration = msg.duration;
      state.remaining       = msg.duration;
      state.running         = false;
      state.endTime         = null;
      saveState();
      break;

    case "start":
      if (!state.running && state.remaining > 0) {
        state.endTime = now + state.remaining;
        state.running = true;
        saveState();

        //schedule expiration alarm
        chrome.alarms.create("timerExpired", { when: state.endTime });
      }
      break;

    case "stop":
      if (state.running) {
        state.remaining = Math.max(0, state.endTime - now);
        state.running   = false;
        state.endTime   = null;
        saveState();

        //clears alarms 
        chrome.alarms.clear("timerExpired");
      }
      break;

    case "reset":
      state.remaining = state.initialDuration;
      state.running   = false;
      state.endTime   = null;
      saveState();

      //clears alarms 
      chrome.alarms.clear("timerExpired");
      break;

    case "getState":
      // if running and expired, clamp
      if (state.running && now >= state.endTime) {
        state.running   = false;
        state.remaining = 0;
        state.endTime   = null;
        saveState();
      }
      break;
  }

  // compute up-to-date remaining
  let rem = state.remaining;
  if (state.running) {
    rem = Math.max(0, state.endTime - now);
  }

  sendResponse({
    remaining:       rem,
    initialDuration: state.initialDuration,
    running:         state.running
  });
  return false;
});



chrome.tabs.onActivated.addListener(activeInfo => {
  if (!state.running)
    return;
  chrome.action.openPopup()
    .then(() => {
      // tell popup “I opened you because of a tab switch”
      chrome.runtime.sendMessage({ type: 'tabSwitch' });
    })
    .catch(err => console.warn("Could not open popup:", err));
    
  //quote flag 
  chrome.storage.local.set({ showQuote: true }, () => {
    chrome.action.openPopup().catch(err =>
      console.warn("Could not open popup:", err)
    );
  });
});

//opens up popup.html even if its closed
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "timerExpired") {
    const ts = Date.now();
    chrome.storage.local.set({ alarmTriggeredAt: ts }, () => {
      chrome.action.openPopup().catch(console.warn);
    });

    //clear alarm
    chrome.alarms.clear("timerExpired");
  }
});