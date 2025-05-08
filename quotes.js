const quotes = [
    "Dream big. Start small. Act now.",
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Push yourself, because no one else is going to do it for you.",
    "Action is the foundational key to all success.",
    "Your future is created by what you do today, not tomorrow.",
];

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }