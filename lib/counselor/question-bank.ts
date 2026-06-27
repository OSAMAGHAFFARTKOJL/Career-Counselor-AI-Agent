import type { McqQuestion } from '@/lib/counselor/types';

export const counselorQuestions: McqQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which school task gives you the most energy?',
    helper: 'Pick the one that feels naturally exciting, not what looks prestigious.',
    options: [
      {
        id: 'q1_a',
        label: 'Solving logic-heavy problems',
        description: 'Math, coding, puzzles, optimization',
        weights: { analytical: 3, research: 2, digital: 1 }
      },
      {
        id: 'q1_b',
        label: 'Designing or creating things',
        description: 'Visual work, storytelling, original ideas',
        weights: { creative: 3, digital: 1, riskTaking: 1 }
      },
      {
        id: 'q1_c',
        label: 'Leading group activities',
        description: 'Presenting, coordinating, motivating',
        weights: { leadership: 3, social: 2, business: 1 }
      },
      {
        id: 'q1_d',
        label: 'Building practical outcomes',
        description: 'Projects, prototypes, real-life execution',
        weights: { handsOn: 3, structured: 1, business: 1 }
      }
    ]
  },
  {
    id: 'q2',
    prompt: 'What kind of impact matters most to you?',
    helper: 'Your motivation often predicts long-term satisfaction.',
    options: [
      {
        id: 'q2_a',
        label: 'Helping people directly',
        description: 'Mentoring, support, social change',
        weights: { social: 3, leadership: 1 }
      },
      {
        id: 'q2_b',
        label: 'Building scalable systems',
        description: 'Products and processes used by many',
        weights: { analytical: 2, digital: 2, business: 1 }
      },
      {
        id: 'q2_c',
        label: 'Inventing something new',
        description: 'Research and discovery',
        weights: { research: 3, analytical: 1, creative: 1 }
      },
      {
        id: 'q2_d',
        label: 'Running outcomes end-to-end',
        description: 'Ownership and measurable results',
        weights: { leadership: 2, business: 2, structured: 1 }
      }
    ]
  },
  {
    id: 'q3',
    prompt: 'When a big project starts, what role do you naturally take?',
    helper: 'Think about your default behavior, not forced behavior.',
    options: [
      {
        id: 'q3_a',
        label: 'Planner',
        description: 'Breaks work into steps and timelines',
        weights: { structured: 3, leadership: 1, analytical: 1 }
      },
      {
        id: 'q3_b',
        label: 'Problem solver',
        description: 'Unblocks technical or logical issues',
        weights: { analytical: 3, research: 1, digital: 1 }
      },
      {
        id: 'q3_c',
        label: 'Communicator',
        description: 'Aligns people and keeps morale high',
        weights: { social: 2, leadership: 2, business: 1 }
      },
      {
        id: 'q3_d',
        label: 'Maker',
        description: 'Turns ideas into working output quickly',
        weights: { handsOn: 2, creative: 2, riskTaking: 1 }
      }
    ]
  },
  {
    id: 'q4',
    prompt: 'How do you feel about uncertainty?',
    helper: 'Career fit is strongly tied to your risk comfort.',
    options: [
      {
        id: 'q4_a',
        label: 'I need clear structure first',
        description: 'Defined process lowers stress',
        weights: { structured: 3, riskTaking: 0 }
      },
      {
        id: 'q4_b',
        label: 'I can handle moderate ambiguity',
        description: 'Some flexibility, some guardrails',
        weights: { structured: 1, riskTaking: 1, business: 1 }
      },
      {
        id: 'q4_c',
        label: 'I enjoy figuring things out from scratch',
        description: 'Ambiguity is energizing',
        weights: { riskTaking: 3, creative: 1, leadership: 1 }
      },
      {
        id: 'q4_d',
        label: 'Depends on mission and team',
        description: 'I adapt if purpose is strong',
        weights: { social: 1, leadership: 1, riskTaking: 1 }
      }
    ]
  },
  {
    id: 'q5',
    prompt: 'Which feedback makes you happiest?',
    helper: 'This reveals your personal success metric.',
    options: [
      {
        id: 'q5_a',
        label: 'Your analysis was sharp',
        description: 'Accuracy and insight',
        weights: { analytical: 3, research: 1 }
      },
      {
        id: 'q5_b',
        label: 'Your idea was original',
        description: 'Creativity and imagination',
        weights: { creative: 3, riskTaking: 1 }
      },
      {
        id: 'q5_c',
        label: 'You handled people brilliantly',
        description: 'Collaboration and communication',
        weights: { social: 2, leadership: 2 }
      },
      {
        id: 'q5_d',
        label: 'You executed with discipline',
        description: 'Consistency and delivery',
        weights: { structured: 2, handsOn: 2, business: 1 }
      }
    ]
  },
  {
    id: 'q6',
    prompt: 'What kind of learning style suits you most?',
    helper: 'Choose how you actually learn fastest.',
    options: [
      {
        id: 'q6_a',
        label: 'Concepts then application',
        description: 'Theory first, then practice',
        weights: { research: 2, analytical: 2 }
      },
      {
        id: 'q6_b',
        label: 'Hands-on projects immediately',
        description: 'Build first, polish later',
        weights: { handsOn: 3, riskTaking: 1 }
      },
      {
        id: 'q6_c',
        label: 'Collaborative learning',
        description: 'Discussing with peers and mentors',
        weights: { social: 2, leadership: 1, business: 1 }
      },
      {
        id: 'q6_d',
        label: 'Structured curricula',
        description: 'Syllabi, routines, checkpoints',
        weights: { structured: 3, digital: 1 }
      }
    ]
  },
  {
    id: 'q7',
    prompt: 'Pick the environment where you would likely thrive.',
    helper: 'Environment-fit matters as much as role-fit.',
    options: [
      {
        id: 'q7_a',
        label: 'Fast startup',
        description: 'Multiple hats, quick iterations',
        weights: { riskTaking: 2, handsOn: 1, business: 2 }
      },
      {
        id: 'q7_b',
        label: 'Research-focused organization',
        description: 'Deep thinking and experimentation',
        weights: { research: 3, analytical: 1 }
      },
      {
        id: 'q7_c',
        label: 'People-centered team culture',
        description: 'Mentorship and communication',
        weights: { social: 2, leadership: 2 }
      },
      {
        id: 'q7_d',
        label: 'Process-driven company',
        description: 'Predictability and quality standards',
        weights: { structured: 3, business: 1 }
      }
    ]
  },
  {
    id: 'q8',
    prompt: 'If you had 6 months to improve one capability, what would you choose?',
    helper: 'This indicates future identity, not only current strength.',
    options: [
      {
        id: 'q8_a',
        label: 'Technical depth',
        description: 'Coding, data, systems',
        weights: { digital: 3, analytical: 2 }
      },
      {
        id: 'q8_b',
        label: 'Design and storytelling',
        description: 'Craft and communication through artifacts',
        weights: { creative: 2, social: 1, digital: 1 }
      },
      {
        id: 'q8_c',
        label: 'Leadership and influence',
        description: 'Decision-making and team coordination',
        weights: { leadership: 3, business: 1, social: 1 }
      },
      {
        id: 'q8_d',
        label: 'Execution and operations',
        description: 'Reliability, delivery, scale',
        weights: { structured: 2, business: 2, handsOn: 1 }
      }
    ]
  },
  {
    id: 'q9',
    prompt: 'How do you make tough decisions?',
    helper: 'Different careers reward different decision styles.',
    options: [
      {
        id: 'q9_a',
        label: 'Data and evidence first',
        description: 'I trust metrics and analysis',
        weights: { analytical: 3, research: 1, business: 1 }
      },
      {
        id: 'q9_b',
        label: 'User empathy first',
        description: 'I prioritize human impact',
        weights: { social: 3, creative: 1 }
      },
      {
        id: 'q9_c',
        label: 'Vision and conviction',
        description: 'I move with strong directional bets',
        weights: { leadership: 2, riskTaking: 2, business: 1 }
      },
      {
        id: 'q9_d',
        label: 'What can be executed well',
        description: 'I focus on feasible outcomes',
        weights: { structured: 2, handsOn: 2 }
      }
    ]
  },
  {
    id: 'q10',
    prompt: 'Which statement sounds most like you today?',
    helper: 'This helps quantify confidence and exploration stage.',
    options: [
      {
        id: 'q10_a',
        label: 'I know exactly what I want',
        description: 'Need validation and roadmap',
        weights: { structured: 1, leadership: 1 }
      },
      {
        id: 'q10_b',
        label: 'I have 2 to 3 possible paths',
        description: 'Need decision confidence',
        weights: { analytical: 1, business: 1 }
      },
      {
        id: 'q10_c',
        label: 'I feel confused and overwhelmed',
        description: 'Need clarity and prioritization',
        weights: { research: 1, social: 1 }
      },
      {
        id: 'q10_d',
        label: 'I want to explore before deciding',
        description: 'Need safe experiments and feedback loops',
        weights: { riskTaking: 2, creative: 1 }
      }
    ]
  },
  {
    id: 'q11',
    prompt: 'What kind of success pace do you prefer?',
    helper: 'Pace preference often predicts burnout risk.',
    options: [
      {
        id: 'q11_a',
        label: 'Steady and predictable growth',
        description: 'Consistency over volatility',
        weights: { structured: 3, business: 1 }
      },
      {
        id: 'q11_b',
        label: 'Rapid growth with pressure',
        description: 'High challenge, high reward',
        weights: { riskTaking: 3, leadership: 1 }
      },
      {
        id: 'q11_c',
        label: 'Deep mastery over time',
        description: 'Expertise and specialization',
        weights: { research: 2, analytical: 1, digital: 1 }
      },
      {
        id: 'q11_d',
        label: 'Balanced growth with meaning',
        description: 'Sustainable pace and purpose',
        weights: { social: 1, business: 1, structured: 1 }
      }
    ]
  },
  {
    id: 'q12',
    prompt: 'Which challenge do you enjoy most?',
    helper: 'Enjoyable struggle points to sustainable careers.',
    options: [
      {
        id: 'q12_a',
        label: 'Untangling complex systems',
        description: 'Finding root causes in messy data',
        weights: { analytical: 3, research: 1, digital: 1 }
      },
      {
        id: 'q12_b',
        label: 'Creating things people love',
        description: 'Combining usability and creativity',
        weights: { creative: 2, social: 1, digital: 1 }
      },
      {
        id: 'q12_c',
        label: 'Aligning teams around outcomes',
        description: 'Driving direction and accountability',
        weights: { leadership: 3, business: 2 }
      },
      {
        id: 'q12_d',
        label: 'Executing under constraints',
        description: 'Shipping despite limited time/resources',
        weights: { handsOn: 2, structured: 2, riskTaking: 1 }
      }
    ]
  }
];
