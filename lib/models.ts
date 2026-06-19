export interface OllamaModelOption {
  id: string;
  label: string;
  description: string;
}

// Only used for local Ollama dev — ignored in production when GROQ_API_KEY is set.
export const OLLAMA_MODELS: OllamaModelOption[] = [
  { id: 'llama3.2', label: 'Llama 3.2', description: 'Default — balanced quality and speed (3B)' },
  { id: 'mistral', label: 'Mistral', description: 'Best instruction-following and JSON reliability, slower (7B)' },
  { id: 'phi3:mini', label: 'Phi-3 Mini', description: 'Fastest and smallest, less reliable with structured output (3.8B)' },
  { id: 'qwen2.5:7b', label: 'Qwen 2.5 7B', description: 'Strong reasoning and JSON formatting (7B)' },
  { id: 'gemma2:9b', label: 'Gemma 2 9B', description: "Google's model, solid all-around (9B)" },
];
