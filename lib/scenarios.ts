export interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Framework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  coachingInstructions: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cold-call',
    label: 'Cold Call',
    description: "Call a prospect who doesn't know you yet",
    icon: 'Phone',
    color: '#6366f1',
    difficulty: 'Intermediate',
  },
  {
    id: 'discovery',
    label: 'Discovery Call',
    description: 'Qualify the prospect and uncover their needs',
    icon: 'Search',
    color: '#8b5cf6',
    difficulty: 'Beginner',
  },
  {
    id: 'demo',
    label: 'Product Demo',
    description: 'Present your product to an interested prospect',
    icon: 'Monitor',
    color: '#06b6d4',
    difficulty: 'Intermediate',
  },
  {
    id: 'objection',
    label: 'Objection Handling',
    description: 'Tackle tough objections from a skeptical buyer',
    icon: 'Shield',
    color: '#f59e0b',
    difficulty: 'Advanced',
  },
  {
    id: 'closing',
    label: 'Closing Call',
    description: 'Push for the deal with a warm prospect',
    icon: 'Target',
    color: '#22c55e',
    difficulty: 'Advanced',
  },
  {
    id: 'negotiation',
    label: 'Price Negotiation',
    description: 'Negotiate terms and defend your pricing',
    icon: 'DollarSign',
    color: '#ef4444',
    difficulty: 'Advanced',
  },
];

export const FRAMEWORKS: Framework[] = [
  {
    id: 'none',
    name: 'No Framework',
    shortName: 'General',
    description: 'General sales best practices',
    coachingInstructions: 'Coach on general sales fundamentals: active listening, clear value proposition, handling objections, and moving toward commitment.',
  },
  {
    id: 'spin',
    name: 'SPIN Selling',
    shortName: 'SPIN',
    description: 'Situation → Problem → Implication → Need-payoff',
    coachingInstructions: `Coach on the SPIN Selling methodology by Neil Rackham:
- SITUATION questions: gather context (ask sparingly, don't interrogate)
- PROBLEM questions: uncover explicit pain points and challenges
- IMPLICATION questions: explore consequences of the problem (this is the most powerful — most reps skip it)
- NEED-PAYOFF questions: get the prospect to articulate the value of solving the problem themselves
Flag when the rep jumps to pitching before establishing Implications. Flag missing Need-payoff questions.`,
  },
  {
    id: 'meddic',
    name: 'MEDDIC',
    shortName: 'MEDDIC',
    description: 'Metrics · Economic Buyer · Decision Criteria · Decision Process · Identify Pain · Champion',
    coachingInstructions: `Coach on the MEDDIC qualification framework:
- METRICS: Has the rep quantified the business impact? (e.g., "How much does this cost you per month?")
- ECONOMIC BUYER: Has the rep identified who controls the budget and has final sign-off?
- DECISION CRITERIA: Does the rep know what criteria will be used to evaluate solutions?
- DECISION PROCESS: Does the rep understand the steps, timeline, and stakeholders in the decision?
- IDENTIFY PAIN: Has the rep uncovered the prospect's core pain with emotional weight?
- CHAMPION: Is someone inside the org actively advocating for this solution?
Flag any MEDDIC element the rep hasn't addressed yet.`,
  },
  {
    id: 'challenger',
    name: 'Challenger Sale',
    shortName: 'Challenger',
    description: 'Teach · Tailor · Take Control',
    coachingInstructions: `Coach on the Challenger Sale methodology by Matthew Dixon & Brent Adamson:
- TEACH: Does the rep bring a unique insight or reframe how the prospect thinks about their problem? (Not product features — business insight)
- TAILOR: Is the message tailored to what matters to THIS specific person in THEIR role?
- TAKE CONTROL: Is the rep assertive and confident? Do they push back constructively rather than capitulating to every objection?
- Commercial Teaching: The rep should lead with insight that creates constructive tension, not lead with questions.
Flag when the rep is too passive, agrees too quickly with objections, or pitches features instead of teaching insights.`,
  },
  {
    id: 'bant',
    name: 'BANT',
    shortName: 'BANT',
    description: 'Budget · Authority · Need · Timeline',
    coachingInstructions: `Coach on the BANT qualification framework:
- BUDGET: Has the rep confirmed whether budget exists and its approximate size?
- AUTHORITY: Has the rep identified the decision-maker and their authority level?
- NEED: Has the rep clearly validated a specific, urgent business need?
- TIMELINE: Has the rep established a realistic timeline for decision and implementation?
Flag when the rep moves forward without qualifying all four elements. Remind them that selling to someone without budget or authority wastes everyone's time.`,
  },
  {
    id: 'sandler',
    name: 'Sandler Selling',
    shortName: 'Sandler',
    description: 'Pain-first · No free consulting · Mutual qualification',
    coachingInstructions: `Coach on the Sandler Selling System by David Sandler:
- PAIN FIRST: The rep should uncover pain at three levels — surface problem, business impact, personal impact
- NO FREE CONSULTING: Flag when the rep gives away solutions or advice without commitment from the prospect
- REVERSE THE PRESSURE: When the prospect pushes back, the rep should use reverse questions ("That's fair — maybe this isn't the right fit?")
- UPFRONT CONTRACTS: The rep should set clear agendas and get micro-commitments at each stage
- QUALIFY HARD: The rep should be willing to disqualify prospects — not everyone is a fit
Flag when the rep is "pitching" or being too eager. In Sandler, the rep qualifies as much as the prospect does.`,
  },
  {
    id: 'solution',
    name: 'Solution Selling',
    shortName: 'Solution',
    description: 'Diagnose pain → prescribe solution → prove value',
    coachingInstructions: `Coach on Solution Selling by Michael Bosworth:
- DIAGNOSE BEFORE PRESCRIBING: The rep must fully understand the pain before mentioning the solution
- PAIN CHAIN: Help the rep trace pain from the frontline user up to executive business impact
- SOLUTION VISION: Guide the prospect to envision what success looks like with the solution in place
- PROOF OF VALUE: The rep should tie every feature to a specific business outcome with numbers where possible
- SPONSOR LETTER: The rep should aim to document agreed-upon pain, solution, and value with the internal champion
Flag when the rep pitches features without tying them to the prospect's specific diagnosed pain.`,
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getFrameworkById(id: string): Framework | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}

export function buildSystemPrompt(
  scenario: string,
  settings: {
    userName: string;
    companyName: string;
    productDescription: string;
    targetCustomer: string;
    valueProposition: string;
    commonObjections: string[];
  },
  frameworkId?: string,
  generatedObjections?: string[]
): string {
  const framework = frameworkId ? getFrameworkById(frameworkId) : null;

  // Use AI-generated objections if available, fall back to settings, then instruct AI to derive them
  const objectionsSection = generatedObjections && generatedObjections.length > 0
    ? `Objections to raise during this call (weave them in naturally, don't list them all at once):
${generatedObjections.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
    : settings.commonObjections.length > 0
    ? `Raise objections relevant to this product and prospect. Some likely ones: ${settings.commonObjections.join(', ')}. Add others that feel natural given the product and your role.`
    : `Raise 3-5 realistic objections a ${settings.targetCustomer} would naturally have about "${settings.productDescription}" — think about price, ROI, implementation effort, internal buy-in, competitors, or timing. Weave them in naturally.`;

  const frameworkSection = framework && framework.id !== 'none'
    ? `\n\nSALES FRAMEWORK BEING PRACTICED: ${framework.name}
${framework.coachingInstructions}
Your coaching tips should specifically reference ${framework.shortName} principles by name and tell the salesperson which step/element they're on or missing.`
    : '';

  return `ROLE: You are playing a BUYER / PROSPECT in a sales roleplay exercise. You are NOT a salesperson. You are NOT selling anything. You are the person being sold to.

The person talking to you (${settings.userName}) is the salesperson. They work at ${settings.companyName} and are trying to sell you: ${settings.productDescription}.
Their pitch to you is: ${settings.valueProposition}.
Their typical customer is: ${settings.targetCustomer}.

YOUR JOB: React like a real buyer would — skeptical, busy, with your own priorities. Push back, ask hard questions, raise concerns. Do NOT help them sell. Do NOT offer solutions. You are evaluating whether to buy, not selling.

${objectionsSection}

Scenario-specific behavior for this call (${scenario}):
- cold-call: You didn't expect this call and you're busy. Open skeptical: "I only have 2 minutes." Warm up slowly only if their pitch earns it.
- discovery: You're cautiously open. Share pain points gradually — make them ask the right questions to get information out of you.
- demo: You're interested but critical. Ask detailed questions, probe edge cases, bring up competitors you already use.
- objection: Raise your objections persistently. Push back 2-3 times before softening — don't cave on the first rebuttal.
- closing: You're warm but have lingering hesitations — timing, budget approval, a competing vendor. Need one more convincing push.
- negotiation: Push hard on price. Ask for discounts, better terms, extra features. Make them defend every dollar.

Keep responses 2-4 sentences. Stay fully in character as the buyer. Never break character. Never offer to sell anything.
${frameworkSection}
After EVERY response, add one coaching tip for the salesperson on a NEW line, starting EXACTLY with "COACHING_TIP:" — 1-2 sentences, specific to what they just said. This is an out-of-character aside; your in-character buyer response comes first.
Format: COACHING_TIP: [tip here]`;
}
