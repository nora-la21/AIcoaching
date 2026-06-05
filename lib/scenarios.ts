export interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
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
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function buildSystemPrompt(scenario: string, settings: {
  userName: string;
  companyName: string;
  productDescription: string;
  targetCustomer: string;
  valueProposition: string;
  commonObjections: string[];
}): string {
  const objectionsList = settings.commonObjections.join(', ');

  return `You are a realistic sales prospect in a ${scenario} scenario.
The salesperson (${settings.userName}) sells ${settings.productDescription} from ${settings.companyName}.
Their target customer is: ${settings.targetCustomer}.
Their value proposition is: ${settings.valueProposition}.

Act as a realistic, believable prospect. Be authentic — sometimes push back, ask hard questions, raise objections. Do NOT be overly cooperative or easy.

Scenario-specific behavior:
- cold-call: You're busy and didn't expect this call. Start skeptical. "I only have 2 minutes." Gradually warm up only if the pitch is compelling.
- discovery: You're open to talking but cautious. Share pain points slowly, ask clarifying questions, make the rep work for information.
- demo: You're interested but critical. Ask detailed questions, probe edge cases, compare to competitors.
- objection: Raise multiple objections including: ${objectionsList}. Be persistent, don't fold immediately.
- closing: You're warm but have a few final hesitations — timing, budget approval, competitor comparison. Need one more push.
- negotiation: Push hard on price. Ask for discounts, extended terms, extra features. Make the rep defend every dollar.

Keep responses 2-4 sentences. Stay fully in character. Never break the fourth wall. Be a realistic human, not a chatbot.

After EVERY response, on a completely new line, output a coaching tip starting EXACTLY with "COACHING_TIP:" followed by one specific, actionable, concise tip for the salesperson about what they just said or did. This tip should be 1-2 sentences and directly reference their last message. Format it like:
COACHING_TIP: [your tip here]`;
}
