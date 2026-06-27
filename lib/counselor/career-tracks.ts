import type { TraitVector } from '@/lib/counselor/types';

export type CareerTrack = {
  role: string;
  mission: string;
  salaryRange: string;
  marketDemand: 'Moderate' | 'High' | 'Very High';
  growthOutlook: string;
  weights: Partial<TraitVector>;
  signalKeywords: string[];
  requiredSkills: string[];
  firstSprint: string[];
};

export const careerTracks: CareerTrack[] = [
  {
    role: 'Product Manager',
    mission: 'Translate user problems into product decisions and align teams around outcomes.',
    salaryRange: '$70k - $150k',
    marketDemand: 'Very High',
    growthOutlook: 'Strong growth as digital products expand across industries.',
    weights: {
      leadership: 0.95,
      business: 0.9,
      analytical: 0.75,
      social: 0.7,
      structured: 0.65
    },
    signalKeywords: ['roadmap', 'stakeholder', 'feature', 'metrics', 'strategy', 'user research'],
    requiredSkills: ['prioritization', 'communication', 'experimentation', 'product thinking'],
    firstSprint: [
      'Pick one app you use daily and write a 1-page product teardown.',
      'Interview 5 users and summarize recurring pain points.',
      'Design a small feature PRD with success metrics.'
    ]
  },
  {
    role: 'Data Analyst',
    mission: 'Turn noisy data into decisions that improve business performance.',
    salaryRange: '$60k - $130k',
    marketDemand: 'Very High',
    growthOutlook: 'Data-driven decision roles continue growing in nearly every sector.',
    weights: {
      analytical: 1,
      research: 0.7,
      structured: 0.7,
      digital: 0.85,
      business: 0.65
    },
    signalKeywords: ['excel', 'sql', 'python', 'dashboard', 'analytics', 'reporting'],
    requiredSkills: ['sql', 'data visualization', 'critical thinking', 'storytelling with data'],
    firstSprint: [
      'Complete one end-to-end SQL mini project on a public dataset.',
      'Build a dashboard and record a 3-minute walkthrough.',
      'Write one decision memo from your analysis.'
    ]
  },
  {
    role: 'UX Researcher',
    mission: 'Understand users deeply and influence better product design.',
    salaryRange: '$65k - $140k',
    marketDemand: 'High',
    growthOutlook: 'Growing demand where user experience quality is a product differentiator.',
    weights: {
      social: 0.95,
      research: 0.95,
      analytical: 0.6,
      creative: 0.55,
      structured: 0.5
    },
    signalKeywords: ['interview', 'survey', 'persona', 'usability', 'insight', 'behavior'],
    requiredSkills: ['user interviews', 'synthesis', 'research planning', 'insight communication'],
    firstSprint: [
      'Run 5 user interviews on a single app experience.',
      'Create a findings report with top behavior patterns.',
      'Present 3 design recommendations from evidence.'
    ]
  },
  {
    role: 'Graphic Designer',
    mission: 'Create visual communication assets for products, brands, and campaigns.',
    salaryRange: '$45k - $100k',
    marketDemand: 'High',
    growthOutlook: 'Steady demand with strong opportunities in digital and brand ecosystems.',
    weights: {
      creative: 1,
      social: 0.55,
      structured: 0.45,
      digital: 0.5,
      business: 0.35
    },
    signalKeywords: ['photoshop', 'illustrator', 'figma', 'branding', 'visual design', 'typography', 'layout'],
    requiredSkills: ['visual hierarchy', 'branding systems', 'design tools', 'portfolio storytelling'],
    firstSprint: [
      'Design a mini brand kit (logo, color palette, typography, usage rules).',
      'Create 3 social ad creatives and test which gets better engagement.',
      'Publish a portfolio case study showing process from brief to final output.'
    ]
  },
  {
    role: 'Software Engineer',
    mission: 'Build reliable software systems that solve real user problems.',
    salaryRange: '$70k - $180k',
    marketDemand: 'Very High',
    growthOutlook: 'Sustained demand with specialization upside in AI, cloud, and platform roles.',
    weights: {
      digital: 1,
      analytical: 0.95,
      handsOn: 0.75,
      structured: 0.55,
      riskTaking: 0.35
    },
    signalKeywords: ['javascript', 'typescript', 'react', 'node', 'api', 'algorithm', 'git'],
    requiredSkills: ['coding', 'problem solving', 'debugging', 'system design basics'],
    firstSprint: [
      'Build and deploy one full-stack mini project.',
      'Solve 15 algorithm or coding practice problems.',
      'Document architecture and trade-offs in README.'
    ]
  },
  {
    role: 'AI Engineer',
    mission: 'Build and deploy machine-learning and LLM-powered systems for real-world problems.',
    salaryRange: '$85k - $220k',
    marketDemand: 'Very High',
    growthOutlook: 'Rapid growth as companies productize AI capabilities across functions.',
    weights: {
      digital: 1,
      analytical: 0.95,
      research: 0.75,
      handsOn: 0.65,
      riskTaking: 0.35
    },
    signalKeywords: ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'llm', 'nlp', 'model training', 'inference'],
    requiredSkills: ['ml fundamentals', 'python', 'model evaluation', 'deployment and monitoring'],
    firstSprint: [
      'Reproduce one public ML/LLM project and document results end-to-end.',
      'Build a small AI feature and deploy it with an API endpoint.',
      'Write evaluation metrics and failure-case analysis for your model.'
    ]
  },
  {
    role: 'Digital Marketer',
    mission: 'Drive growth using messaging, channels, and measurable campaigns.',
    salaryRange: '$50k - $120k',
    marketDemand: 'High',
    growthOutlook: 'Performance and growth marketing remain core for digital-first businesses.',
    weights: {
      creative: 0.8,
      business: 0.9,
      social: 0.7,
      analytical: 0.65,
      riskTaking: 0.55
    },
    signalKeywords: ['campaign', 'content', 'seo', 'conversion', 'growth', 'branding'],
    requiredSkills: ['copywriting', 'channel strategy', 'analytics', 'experimentation'],
    firstSprint: [
      'Launch one niche content campaign on a chosen channel.',
      'Track CTR, conversion, and retention for 2 weeks.',
      'Run one A/B test and document learning.'
    ]
  },
  {
    role: 'Operations Analyst',
    mission: 'Improve systems, workflows, and execution efficiency.',
    salaryRange: '$55k - $115k',
    marketDemand: 'High',
    growthOutlook: 'Operations optimization roles expand as companies focus on efficiency.',
    weights: {
      structured: 0.95,
      analytical: 0.8,
      business: 0.75,
      handsOn: 0.65,
      leadership: 0.45
    },
    signalKeywords: ['process', 'operations', 'efficiency', 'workflow', 'kpi', 'optimization'],
    requiredSkills: ['process mapping', 'problem structuring', 'kpi design', 'execution discipline'],
    firstSprint: [
      'Map one broken process and identify bottlenecks.',
      'Design a simple KPI sheet with weekly cadence.',
      'Run a 7-day optimization experiment and quantify gain.'
    ]
  },
  {
    role: 'Business Development Associate',
    mission: 'Create partnerships and growth opportunities through strategic relationships.',
    salaryRange: '$55k - $130k',
    marketDemand: 'High',
    growthOutlook: 'Revenue and partnerships remain central in competitive markets.',
    weights: {
      business: 1,
      social: 0.9,
      leadership: 0.65,
      riskTaking: 0.6,
      structured: 0.45
    },
    signalKeywords: ['sales', 'partnership', 'negotiation', 'pipeline', 'proposal', 'clients'],
    requiredSkills: ['relationship building', 'negotiation', 'market research', 'deal execution'],
    firstSprint: [
      'Research 20 target organizations and rank by fit.',
      'Draft outreach scripts for cold and warm introductions.',
      'Run 5 discovery calls and summarize objections.'
    ]
  }
];
