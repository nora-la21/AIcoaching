'use client';

import {
  Phone,
  Search,
  Monitor,
  Shield,
  Target,
  DollarSign,
  HelpCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Scenario } from '@/lib/scenarios';

const ICONS: Record<string, LucideIcon> = {
  Phone,
  Search,
  Monitor,
  Shield,
  Target,
  DollarSign,
  HelpCircle,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#22c55e',
  Intermediate: '#f59e0b',
  Advanced: '#ef4444',
};

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export default function ScenarioCard({ scenario, onSelect, isSelected }: ScenarioCardProps) {
  const Icon: LucideIcon = ICONS[scenario.icon] || Phone;
  const difficultyColor = DIFFICULTY_COLORS[scenario.difficulty] || '#64748b';

  return (
    <button
      onClick={() => onSelect(scenario.id)}
      className="w-full text-left rounded-xl p-5 transition-all duration-200 group"
      style={{
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#16161f',
        border: isSelected
          ? '1px solid rgba(99, 102, 241, 0.5)'
          : '1px solid #2a2a3c',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#3d3d55';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#16161f';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a3c';
        }
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${scenario.color}18`,
            border: `1px solid ${scenario.color}30`,
          }}
        >
          <Icon size={18} color={scenario.color} />
        </div>
        <ArrowRight
          size={16}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: isSelected ? '#6366f1' : '#2a2a3c' }}
        />
      </div>

      <h3 className="font-semibold text-sm mb-1" style={{ color: '#f1f5f9' }}>
        {scenario.label}
      </h3>
      <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>
        {scenario.description}
      </p>

      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          backgroundColor: `${difficultyColor}15`,
          color: difficultyColor,
          border: `1px solid ${difficultyColor}30`,
        }}
      >
        {scenario.difficulty}
      </span>
    </button>
  );
}
