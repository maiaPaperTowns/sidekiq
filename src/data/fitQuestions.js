// Fit-check questionnaire shown inside the opportunity modal. This is the
// user's own self-assessment, not derived from job-board data.
export const FIT_QUESTIONS = [
  {
    id: 'timing',
    prompt: 'How does the timing land for you?',
    options: [
      { label: 'Wide open', value: 2 },
      { label: 'Tight but doable', value: 1 },
      { label: 'Real conflict', value: 0 },
    ],
  },
  {
    id: 'materials',
    prompt: 'How much of the required material do you already have?',
    options: [
      { label: 'Most of it', value: 2 },
      { label: 'About half', value: 1 },
      { label: 'Starting fresh', value: 0 },
    ],
  },
  {
    id: 'interest',
    prompt: 'Honestly, how much do you want this one?',
    options: [
      { label: 'Top of my list', value: 2 },
      { label: 'Curious', value: 1 },
      { label: 'Just browsing', value: 0 },
    ],
  },
];
