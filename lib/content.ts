export const TAGLINE = "Study smarter. Understand more. Achieve your goals.";

export const FAQS = [
  {
    question: "What can I upload?",
    answer:
      "PDF, DOCX, TXT, or text you paste in. StudyPilot reads the text in the file. A scanned PDF or a photo of a page has no text layer, so it will say it could not read the file instead of inventing notes.",
  },
  {
    question: "Does the AI use only my material?",
    answer:
      "Notes, flashcards, and quizzes are instructed to stay inside the text you uploaded and not to add facts that are not there. The tutor answers from that text first and marks anything that goes beyond it. Models can still make mistakes, so check important points against your source.",
  },
  {
    question: "Are the quizzes real exam questions?",
    answer:
      "No. They are practice questions written from your material. StudyPilot does not provide official, past, or leaked exam papers.",
  },
  {
    question: "What does the free plan include?",
    answer:
      "Each month: 3 uploads, 5 basic notes, 2 flashcard decks, and 3 quizzes. You also get a manual study planner and progress counted from your own activity. Detailed note styles, the AI tutor, and AI study plans are part of the Student plan.",
  },
  {
    question: "Can I pay for Student or Pro?",
    answer:
      "Not yet. The prices are listed so the plans are clear, but checkout is not connected. Paid features stay locked until a payment is verified. StudyPilot does not store card numbers.",
  },
  {
    question: "Who can see my notes?",
    answer:
      "Your study material is stored in your Firebase project and the security rules only allow that account to read it. Text you generate from is sent to the Grok API to produce the result. You can delete a document or your whole account from Settings.",
  },
  {
    question: "Is there a minimum age?",
    answer:
      "Yes. StudyPilot is for people who are 13 or older. You confirm that before using the app. It is not directed at children.",
  },
];

export const FEATURES = [
  {
    title: "AI notes",
    body: "Turn a chapter into a short summary, a simple explanation, key points, definitions, or — on Student and Pro — a detailed, chapter-by-chapter, or revision set. Edit and export what you keep.",
  },
  {
    title: "Flashcards",
    body: "Generate a deck of questions and answers from the same material. Flip the cards, shuffle them, mark difficulty, and track what you have learned.",
  },
  {
    title: "Practice quizzes",
    body: "Multiple choice, true or false, short answer, or a mix. Pick how many and how hard. The app marks the attempt, saves the score, and explains the ones you missed.",
  },
  {
    title: "Study planner",
    body: "Add your own tasks on the free plan. An AI timetable from subjects and exam dates is part of Student and Pro, and it stays locked until payments are connected.",
  },
  {
    title: "AI tutor",
    body: "Ask questions about one of your documents. The tutor is part of the Student plan. It is built, and it unlocks only when that plan is active.",
  },
  {
    title: "Progress from real activity",
    body: "Sessions, quiz scores, learned cards, and streaks come from what you have actually done. There is no sample data mixed in.",
  },
];
