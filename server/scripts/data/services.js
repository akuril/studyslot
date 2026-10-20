// StudySlot seed catalog. ALL names, tutors, and descriptions are fictional.
// Do not add real people, schools, phone numbers, or emails here.
// Prices are in cents (4500 = $45.00).

export const seedServices = [
  {
    name: 'Middle School Math Boost',
    subject: 'math',
    gradeBand: '6-8',
    summary: 'One-on-one help with fractions, ratios, equations, and test prep for grades 6–8.',
    description:
      'Builds confidence with core middle school math. Sessions focus on whatever your student is working on in class, such as fractions, decimals, ratios, proportions, integers, and one- and two-step equations. The tutor explains each idea step by step, works practice problems together, and shares strategies for checking answers before tests.',
    tutorName: 'Ms. Avery Lane',
    durationMinutes: 60,
    priceCents: 4500,
    isActive: true,
  },
  {
    name: 'Algebra & Geometry Coaching',
    subject: 'math',
    gradeBand: '9-12',
    summary: 'Support for Algebra 1, Geometry, and Algebra 2: concepts, homework, and exam review.',
    description:
      'Targeted coaching for high school math courses. Covers linear and quadratic equations, functions and graphs, systems, proofs, triangles, circles, and trigonometry basics. Sessions mix concept review with guided practice so students can complete homework on their own and walk into unit tests prepared.',
    tutorName: 'Mr. Theo Grant',
    durationMinutes: 60,
    priceCents: 5500,
    isActive: true,
  },
  {
    name: 'Life & Earth Science Help',
    subject: 'science',
    gradeBand: '6-8',
    summary:
      'Clear explanations of cells, ecosystems, weather, and the scientific method for grades 6–8.',
    description:
      'Helps middle school students understand life and earth science topics such as cells, body systems, ecosystems, rocks and minerals, weather, and space. The tutor uses simple diagrams and real-world examples, and helps with lab reports, vocabulary, and test review.',
    tutorName: 'Ms. Rosa Mendel',
    durationMinutes: 45,
    priceCents: 4000,
    isActive: true,
  },
  {
    name: 'Biology & Chemistry Tutoring',
    subject: 'science',
    gradeBand: '9-12',
    summary: 'High school biology and chemistry help: concepts, lab reports, and exam preparation.',
    description:
      'Covers high school biology (cells, genetics, evolution, ecology) and chemistry (atoms, bonding, reactions, stoichiometry, solutions). Sessions break hard topics into manageable steps, build problem-solving habits for calculations, and help students organize notes and lab write-ups.',
    tutorName: 'Dr. Priya Nair',
    durationMinutes: 60,
    priceCents: 5500,
    isActive: true,
  },
  {
    name: 'Reading & Writing Workshop',
    subject: 'english',
    gradeBand: '6-8',
    summary: 'Builds reading comprehension, vocabulary, and paragraph writing for grades 6–8.',
    description:
      'A supportive workshop for middle school English. Students practice finding main ideas, making inferences, and citing evidence from texts, then turn those skills into clear paragraphs and short essays. Includes grammar and vocabulary practice tied to current class reading.',
    tutorName: 'Mr. Jonah Reed',
    durationMinutes: 45,
    priceCents: 4000,
    isActive: true,
  },
  {
    name: 'Essay Writing Coach',
    subject: 'english',
    gradeBand: '9-12',
    summary: 'Plan, draft, and revise strong essays for high school English and other classes.',
    description:
      'Coaching for every stage of the writing process: understanding the prompt, building a thesis, outlining, drafting, and revising. Works for literary analysis, argument, and research essays. The coach gives specific feedback and teaches revision strategies; students always write their own work.',
    tutorName: 'Ms. Claire Whitfield',
    durationMinutes: 60,
    priceCents: 5000,
    isActive: true,
  },
  {
    name: 'World History & Geography Help',
    subject: 'social-studies',
    gradeBand: '6-8',
    summary: 'Makes ancient civilizations, world cultures, and map skills easier for grades 6–8.',
    description:
      'Helps middle school students with world history and geography units, including ancient civilizations, world cultures, and map and globe skills. Sessions focus on understanding cause and effect, organizing timelines, studying key vocabulary, and preparing for quizzes and projects.',
    tutorName: 'Mr. Samuel Ortiz',
    durationMinutes: 45,
    priceCents: 4000,
    isActive: true,
  },
  {
    name: 'U.S. History & Government Review',
    subject: 'social-studies',
    gradeBand: '9-12',
    summary: 'Review U.S. history, civics, and government with a focus on writing and exam prep.',
    description:
      'Support for high school U.S. History and Government courses. Covers major eras, founding documents, the branches of government, and landmark court cases. Students practice analyzing primary sources, writing document-based responses, and reviewing for unit and end-of-course exams.',
    tutorName: 'Ms. Hannah Brooks',
    durationMinutes: 60,
    priceCents: 5000,
    isActive: true,
  },
  {
    name: 'Spanish Practice & Conversation',
    subject: 'world-languages',
    gradeBand: '6-12',
    summary: 'Speaking practice, grammar, and vocabulary support for Spanish 1–3 students.',
    description:
      'Helps students in beginning and intermediate Spanish classes build confidence speaking and writing. Sessions combine conversation practice with grammar review (verb tenses, agreement, pronouns) and vocabulary from current class units, plus preparation for oral and written assessments.',
    tutorName: 'Sra. Lucia Fernandez',
    durationMinutes: 45,
    priceCents: 4500,
    isActive: true,
  },
  {
    name: 'Intro to Coding with Python',
    subject: 'computer-science',
    gradeBand: '6-12',
    summary:
      'Beginner-friendly Python: variables, loops, and small projects, or help with CS classes.',
    description:
      'A friendly introduction to programming with Python for complete beginners, or support for students in a computer science class. Covers variables, conditions, loops, functions, and debugging through small hands-on projects. Students write and run their own code in every session.',
    tutorName: 'Mr. Kai Thompson',
    durationMinutes: 60,
    priceCents: 5500,
    isActive: true,
  },
  {
    name: 'Study Skills & Organization Coaching',
    subject: 'study-skills',
    gradeBand: '6-12',
    summary: 'Planning, note-taking, and test-study habits for students who feel overwhelmed.',
    description:
      'Coaching for students who struggle with keeping track of assignments, managing time, or studying effectively. Sessions build practical routines: using a planner, breaking big projects into steps, taking useful notes, and making a study plan before tests. Works alongside any subject.',
    tutorName: 'Ms. Nora Patel',
    durationMinutes: 45,
    priceCents: 4000,
    isActive: true,
  },
  {
    name: 'SAT & ACT Prep',
    subject: 'test-prep',
    gradeBand: '9-12',
    summary:
      'Focused SAT and ACT preparation: content review, practice sections, and test strategy.',
    description:
      'Structured preparation for the SAT or ACT. Sessions review the math, reading, and writing skills each test measures, work through timed practice sections, and teach pacing and question strategies. The tutor helps students track progress and focus on the areas with the most room to improve.',
    tutorName: 'Mr. Marcus Bell',
    durationMinutes: 90,
    priceCents: 7500,
    isActive: true,
  },
  {
    name: 'Homework Help Hour',
    subject: 'homework-help',
    gradeBand: '6-12',
    summary: 'Short drop-in style help with tonight’s homework in any core subject.',
    description:
      'A short session for getting unstuck on homework in math, science, English, or social studies. The tutor helps students understand what the assignment is asking and guides them through it, without doing the work for them. Good for busy weeks or a quick confidence boost.',
    tutorName: 'Ms. Dana Okoro',
    durationMinutes: 30,
    priceCents: 2500,
    isActive: true,
  },
  {
    // Inactive on purpose: proves inactive services are hidden and cannot be booked.
    name: 'Summer Math Bridge',
    subject: 'math',
    gradeBand: '6-8',
    summary: 'Seasonal program that reviews key math skills before the new school year.',
    description:
      'A seasonal review program that refreshes key math skills over the summer so students start the new school year ready. Currently not offered.',
    tutorName: 'Ms. Avery Lane',
    durationMinutes: 60,
    priceCents: 4500,
    isActive: false,
  },
];
