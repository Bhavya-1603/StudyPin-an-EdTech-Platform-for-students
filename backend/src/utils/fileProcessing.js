export function extractStudyMetadata(file) {
  return {
    text: `Extracted text from ${file.originalname}. This placeholder represents OCR and extraction from study materials.`,
    summary: `AI summary for ${file.originalname}: This material covers core concepts, formulas, and revision tips for exam-ready learning.`,
    flashcards: [
      {
        question: 'What is the primary concept in this note?',
        answer: 'The material focuses on key formulas and concept relationships for fast recall.',
      },
      {
        question: 'How should you revise this note?',
        answer: 'Use the summary, flashcards, and mind map to structure review sessions.',
      },
    ],
    mindMap: ['Core idea', 'Supporting formulas', 'Example problems'],
    difficulty: 'Medium',
    subject: 'Mathematics',
    tags: ['AI generated', 'Uploaded', 'StudyPin'],
  }
}

export function generateStudyInsights(text) {
  return {
    shortSummary: `${text.slice(0, 120)}...`,
    detailedSummary: `${text.slice(0, 240)}...`,
    keyTopics: ['Core concept', 'Important formula', 'Exam strategy'],
    flashcards: [
      {
        question: 'What should you remember first?',
        answer: 'The key concept and main formula are the foundation for this topic.',
      },
    ],
    difficultyScore: Math.min(100, Math.max(10, Math.round(text.length / 15))),
  }
}