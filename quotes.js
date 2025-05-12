const quotes = [
    "Dream big. Start small. Act now.",
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Push yourself, because no one else is going to do it for you.",
    "Action is the foundational key to all success.",
    "Your future is created by what you do today, not tomorrow.",
    "Discipline equals freedom.",
    "Progess, not perfection.",
    "Make it happen.",
    "Start where you are. Use what you have. Do what you can.",
    "Stay hungry. Stay foolish.",
    "Growth feels like failure until it doesn't.",
    "Doubt kills more dreams than failure ever will.",
    "Be stubborn about your goals and flexible about your methods.",
    "If you're going through hell, keep going.",
    "You won't always be motivated. So you must learn to be disciplined.",
    "The dream is free. The hustle is sold separately.",
    "You don't need more time. You need more focus.",
    "A river cuts through rock not because of its power, but because of its persistence.",
    "Don't fear failure. Fear being in the exact same place next year."
];

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }