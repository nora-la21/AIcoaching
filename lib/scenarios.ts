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

export interface BlindScenario {
  id: string;
  product: string;
  productDescription: string;
  prospect: string;
  prospectSituation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
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
  {
    id: 'question-mastery',
    label: 'Question Mastery',
    description: 'Practice open-ended questions that uncover needs and link to value',
    icon: 'HelpCircle',
    color: '#10b981',
    difficulty: 'Beginner',
  },
  {
    id: 'blind-call',
    label: 'Blind Call',
    description: 'Random product, random prospect — no prep allowed. Sink or swim.',
    icon: 'Shuffle',
    color: '#a855f7',
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
  // ── Question Mastery: fully specialized prompt ──────────────────────────────
  if (scenario === 'question-mastery') {
    return buildQuestionMasteryPrompt(settings);
  }

  const framework = frameworkId ? getFrameworkById(frameworkId) : null;

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

function buildQuestionMasteryPrompt(settings: {
  userName: string;
  companyName: string;
  productDescription: string;
  targetCustomer: string;
  valueProposition: string;
}): string {
  return `ROLE: You are a realistic BUYER in a sales training exercise focused specifically on question quality.

The salesperson (${settings.userName}) is selling: ${settings.productDescription} from ${settings.companyName}.
You are: ${settings.targetCustomer}.
Their value proposition: ${settings.valueProposition}.

YOU HAVE RICH INFORMATION TO SHARE — but you only share it when asked the right way. Follow these rules exactly:

OPEN-ENDED QUESTION (starts with: What, How, Tell me, Walk me through, Describe, Help me understand, Why, In what way) →
Respond with 3-5 sentences. Share specific challenges, goals, frustrations, or context. Be generous with detail. This is how a real prospect opens up when asked well.

CLOSED QUESTION (can be answered yes/no, starts with: Do you, Are you, Is there, Have you, Did you, Can you, Would you) →
Respond in 1 sentence only. Answer literally. Do NOT volunteer extra information. This teaches the salesperson that closed questions close conversations.

PRODUCT PITCH without first understanding a need →
Stay politely skeptical: "Sounds interesting but I'm not sure that's relevant to what we deal with." Do not engage deeply.

PRODUCT VALUE tied directly to a pain point you already mentioned →
Show genuine interest: lean in, ask a follow-up, acknowledge it solves something real.

VALUE-LINKING MOMENT: When the salesperson explicitly connects their product feature to a problem you raised earlier → increase warmth noticeably. This rewards the behaviour you're training.

Keep all responses natural and human. You have real problems: ${settings.targetCustomer} typically struggles with operational complexity, budget pressure, and evaluating too many vendors. Weave in these real frustrations when asked open questions.

After EVERY response, on a new line write your coaching tip starting EXACTLY with "COACHING_TIP:" — follow this exact format:

COACHING_TIP: [OPEN ✓ or CLOSED ✗] — [one sentence evaluating the quality of their last message. If closed, rewrite it as an open version. If they linked value to a stated need, call it out positively. If they pitched without listening first, flag it.]

Examples of good COACHING_TIPs:
COACHING_TIP: CLOSED ✗ — "Do you use multiple tools?" gets a yes/no. Try: "Walk me through how your team currently manages this process."
COACHING_TIP: OPEN ✓ — Good question that opened them up. Now dig deeper into the cost they mentioned: "What's the business impact of that delay?"
COACHING_TIP: VALUE LINK ✓ — You connected the feature directly to their stated pain. This is exactly how to build relevance — keep doing this before introducing any new features.
COACHING_TIP: PITCH TOO SOON ✗ — You pitched a feature before understanding their situation. Ask "What does your current process look like?" first to earn the right to present a solution.`;
}

export const BLIND_SCENARIOS: BlindScenario[] = [
  {
    id: 'marathon-app',
    product: 'Marathon Training App',
    productDescription: 'AI-personalized 16-week training plans, daily workouts, and nutrition coaching — $29/month',
    prospect: 'Alex, 34, marketing manager',
    prospectSituation: 'Signed up for their first marathon in 5 months. Currently running 3×/week with no structured plan. Excited but overwhelmed and secretly terrified of the distance.',
    difficulty: 'Beginner',
  },
  {
    id: 'sleep-wearable',
    product: 'Sleep Optimization Wearable',
    productDescription: 'Medical-grade wrist device that tracks sleep stages and HRV, with daily actionable tips — $199 device + $12/month',
    prospect: 'Jordan, 42, startup CEO',
    prospectSituation: 'Running on 5 hours of sleep a night. Team has mentioned they seem distracted and short-tempered. Spouse is threatening to sleep in the guest room if things don\'t change.',
    difficulty: 'Intermediate',
  },
  {
    id: 'expense-saas',
    product: 'Expense Management Platform',
    productDescription: 'Auto-scans receipts, enforces spend policy, syncs with 40+ accounting tools — $15/user/month, 10-seat minimum',
    prospect: 'Sarah, 38, Finance Director at a 60-person marketing agency',
    prospectSituation: 'Expense reports take her team 3 full days each month. She missed approving a $12K spend last month and got a call from the CEO. She\'s embarrassed and needs a fix before year-end.',
    difficulty: 'Intermediate',
  },
  {
    id: 'dog-course',
    product: 'Dog Training Online Course',
    productDescription: '6-week certified trainer video course covering obedience, leash manners, and separation anxiety — $149 one-time',
    prospect: 'Mike, 29, software engineer',
    prospectSituation: 'Got a Labrador puppy 4 months ago that is destroying furniture, pulling on the leash, and barking all night. His girlfriend is seriously considering moving out if the dog situation doesn\'t improve.',
    difficulty: 'Beginner',
  },
  {
    id: 'team-building',
    product: 'Corporate Team-Building Workshop',
    productDescription: 'Half-day facilitated cooking challenge or escape room for teams of 10–50 — $150–$200/person',
    prospect: 'Chris, 44, HR Director at a 200-person fintech company',
    prospectSituation: 'Two departments merged and refuse to collaborate. Engagement scores dropped 22 points. The CEO has mandated a "culture fix" event before Q4 earnings — Chris has 6 weeks and a tight budget.',
    difficulty: 'Advanced',
  },
  {
    id: 'ergonomic-setup',
    product: 'Premium Home Office Bundle',
    productDescription: 'Electric standing desk + ergonomic chair + monitor arm — $1,200 complete setup, white-glove delivery, 10-year warranty',
    prospect: 'Emma, 32, UX designer, fully remote',
    prospectSituation: 'Working from a kitchen table since COVID. Lower back pain has gotten bad enough she saw a chiropractor twice this month. Her company offers a $600 WFH equipment stipend she\'s never used.',
    difficulty: 'Intermediate',
  },
  {
    id: 'freelancer-tax',
    product: 'Freelancer Tax Software',
    productDescription: 'Automated quarterly tax estimates, expense tracking, and 1099 filing for independent contractors — $25/month or $199/year',
    prospect: 'Tom, 27, freelance graphic designer',
    prospectSituation: 'Got a $3,200 surprise tax bill last April. Tracks expenses in a spreadsheet and missed half his deductions. Tax season is 4 months away and he\'s already anxious about it.',
    difficulty: 'Beginner',
  },
  {
    id: 'mental-health-platform',
    product: 'Corporate Mental Health Benefit',
    productDescription: 'Unlimited video therapy sessions + manager mental health training — $45/employee/month',
    prospect: 'Patricia, 50, Chief People Officer at a 350-person SaaS company',
    prospectSituation: 'Lost 3 senior engineers to burnout last quarter. Glassdoor score dropped. Board is asking about mental health benefits and open enrollment for next year starts in 5 weeks.',
    difficulty: 'Advanced',
  },
  {
    id: 'wine-club',
    product: 'Curated Wine Subscription',
    productDescription: 'Monthly sommelier-curated 6-bottle delivery based on your taste profile — $89/month, cancel anytime',
    prospect: 'James, 46, corporate lawyer',
    prospectSituation: 'Always buys the same 3 wines. His wife\'s birthday is in 3 weeks and she\'s been hinting she wants to explore wine more. Has never tried a subscription and thinks they\'re all gimmicks.',
    difficulty: 'Beginner',
  },
  {
    id: 'coding-kids',
    product: "Children's Coding Bootcamp",
    productDescription: '10-week after-school Python and game dev program for kids 8–14 — $380/semester, twice a week',
    prospect: 'Karen, 39, parent of a 10-year-old boy',
    prospectSituation: 'Her son plays video games 4+ hours a day. She wants to channel that into something productive but worries about the price and whether he\'ll actually stick with it.',
    difficulty: 'Beginner',
  },
  {
    id: 'podcast-production',
    product: 'Podcast Production Service',
    productDescription: 'Full editing, show notes, and social clips per episode — $350/episode, 48-hour turnaround, unlimited revisions',
    prospect: 'Mark, 38, business coach with a bi-weekly podcast',
    prospectSituation: 'Editing each episode takes him 6–8 hours. Growth has stagnated. A potential sponsor walked away because production quality was inconsistent. He knows he needs help but hasn\'t pulled the trigger.',
    difficulty: 'Intermediate',
  },
  {
    id: 'legal-automation',
    product: 'Legal Document Automation Tool',
    productDescription: 'AI-generated NDAs, employment agreements, and client contracts in under 5 minutes — $199/month for solo firms',
    prospect: 'Susan, 41, solo employment attorney',
    prospectSituation: 'Drafts every contract from scratch — 2–3 hours each. Has 5 contracts in her inbox right now. Her paralegal quit last week. Admin work is eating into billable hours and she\'s reaching a breaking point.',
    difficulty: 'Advanced',
  },
  {
    id: 'ebike-subscription',
    product: 'Electric Bike Subscription',
    productDescription: 'Monthly e-bike subscription with insurance and maintenance included — $149/month, no long-term commitment',
    prospect: 'Carlos, 31, product manager in San Francisco',
    prospectSituation: 'Spending $280/month on rideshare since his car was stolen 6 months ago. Keeps researching e-bikes but can\'t justify $3,000 upfront. Knows he needs more exercise but hates the gym.',
    difficulty: 'Intermediate',
  },
  {
    id: 'life-insurance',
    product: 'Term Life Insurance',
    productDescription: '20-year term, $1M coverage — healthy 35-year-old pays ~$35/month, fully digital, approved in 10 minutes',
    prospect: 'Brian, 36, new father with a $450K mortgage',
    prospectSituation: 'His daughter was born 3 months ago. His parents keep asking him about life insurance but he puts it off because "it feels morbid." Has no idea where to start and keeps forgetting about it.',
    difficulty: 'Intermediate',
  },
  {
    id: 'ai-recruitment',
    product: 'AI Recruitment Platform',
    productDescription: 'Auto-ranks resumes, sends video screening questions, syncs with your ATS — $799/month for up to 10 open roles',
    prospect: 'Amanda, 43, Head of Talent at a 120-person e-commerce brand',
    prospectSituation: '12 open roles, 3 sitting open for 90+ days. Spends 4 hours/day on resume review. Just lost a top candidate to a competitor while waiting for hiring manager feedback. CEO is demanding answers.',
    difficulty: 'Advanced',
  },
  {
    id: 'executive-coaching',
    product: 'Executive Leadership Coaching',
    productDescription: '6-month 1-on-1 program with a former Fortune 500 executive — $2,500/month',
    prospect: 'Daniel, 44, VP of Engineering at a Series B startup',
    prospectSituation: 'Recently promoted from senior IC to managing managers. Got brutal 360 feedback he wasn\'t expecting — team says he micromanages and avoids conflict. First time in this kind of leadership role.',
    difficulty: 'Intermediate',
  },
  {
    id: 'meal-prep',
    product: 'Office Meal Prep Delivery',
    productDescription: 'Weekly healthy team lunches, individually labelled, delivered Monday morning — $14/person/week, min 5 people',
    prospect: 'Rachel, 45, Operations Manager at a 22-person startup in crunch mode',
    prospectSituation: 'Team is working brutal hours on a product launch. People take long lunch breaks or eat junk. The CEO wants a perk that keeps people energized and focused without mandating office hours.',
    difficulty: 'Beginner',
  },
  {
    id: 'language-coaching',
    product: 'Business Language Coaching',
    productDescription: 'Live 1-on-1 sessions with a native speaker focused on business fluency — Spanish, Mandarin, or Portuguese — $199/month for 4 sessions',
    prospect: 'David, 51, VP Sales leading expansion into Mexico',
    prospectSituation: 'Major client dinner in Mexico City in 7 weeks. Boss expects him to handle small talk in Spanish. Tried Duolingo for 3 weeks and quit. He\'s embarrassed about it and doesn\'t know who to ask for help.',
    difficulty: 'Intermediate',
  },
  {
    id: 'home-security',
    product: 'Smart Home Security System',
    productDescription: 'Cameras, door sensors, AI monitoring + 45-second police dispatch response — $299 install + $29/month',
    prospect: 'Lisa, 38, stay-at-home parent, husband travels every week',
    prospectSituation: 'Neighbor\'s house was burglarized last month while on vacation. She has two young kids and no security system. Just bought a new TV and laptop. Husband keeps sending her articles but she hasn\'t acted.',
    difficulty: 'Beginner',
  },
  {
    id: 'golf-membership',
    product: 'Private Golf Club Membership',
    productDescription: 'Championship 18-hole course, simulator, hosted corporate events — $5,000 initiation + $350/month dues',
    prospect: 'Robert, 52, Managing Partner at a mid-size law firm',
    prospectSituation: 'Uses golf as his main business development tool but drives 45 minutes to a crowded public course. Two top clients belong to private clubs and keep inviting him. Hesitant to commit with economic uncertainty.',
    difficulty: 'Advanced',
  },
];

export function getRandomBlindScenario(): BlindScenario {
  return BLIND_SCENARIOS[Math.floor(Math.random() * BLIND_SCENARIOS.length)];
}

export function buildBlindCallSystemPrompt(blind: BlindScenario): string {
  return `ROLE: You are playing a BUYER / PROSPECT in a sales roleplay. You are NOT a salesperson. You are NOT selling anything.

Who you are: ${blind.prospect}
Your situation right now: ${blind.prospectSituation}

The salesperson is going to pitch you: ${blind.product} — ${blind.productDescription}

YOUR JOB: React realistically based on your specific situation above.
- Show genuine interest ONLY when they ask the right questions and connect their product to your real situation
- Be appropriately skeptical about price, time commitment, fit, or timing based on your circumstances
- Ask natural questions a real person in your situation would ask
- Don't make it too easy — make them uncover your situation and earn your trust before warming up

Keep responses 2-4 sentences. Stay fully in character. Never break character. Never offer to sell anything.

After EVERY response, on a new line starting EXACTLY with "COACHING_TIP:" write 1-2 sentences of coaching feedback evaluating what the salesperson just said and what they could do better.`;
}
