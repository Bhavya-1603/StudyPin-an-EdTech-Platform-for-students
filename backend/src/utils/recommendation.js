function buildUserProfile(user) {
  return {
    interests: Array.isArray(user.followedSubjects) && user.followedSubjects.length
      ? user.followedSubjects
      : ['Mathematics', 'Physics', 'Computer Science'],
    savedTags: Array.isArray(user.savedTags) && user.savedTags.length
      ? user.savedTags
      : ['StudyPin', 'Exam Prep', 'Revision'],
  }
}

function scoreNote(note, profile) {
  const subjectMatch = profile.interests.includes(note.subject) ? 3 : 0.9
  const tagMatch = (note.tags || []).reduce((count, tag) => (profile.savedTags.includes(tag) ? count + 1 : count), 0)
  const engagement = (note.likes || 0) * 0.15 + (note.saves || 0) * 0.25 + (note.views || 0) * 0.1
  const freshness = note.createdAt
    ? Math.max(0, 1 - (Date.now() - new Date(note.createdAt)) / 1000 / 60 / 60 / 24 / 30)
    : 0
  return subjectMatch * 2 + tagMatch * 1.5 + engagement * 0.1 + freshness * 4 + Math.random() * 0.5
}

export function recommendNotesForUser(user, notes) {
  const profile = buildUserProfile(user || {})
  return notes
    .map((note) => ({ note, score: scoreNote(note, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ note }) => note)
}
