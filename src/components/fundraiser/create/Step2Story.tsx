/**
 * Step 2: Story
 * Summary and Story with AI Enhancement
 */

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AITextEnhancer } from './AITextEnhancer';
import { CharacterCounter } from './CharacterCounter';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoAlert } from './InfoAlert';
import { TipsBox } from './TipsBox';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY } from './designConstants';

interface Step2StoryProps {
  formData: {
    title?: string;
    categoryId?: string;
    goalAmount?: number;
    beneficiaryName?: string;
    summary?: string;
    story?: string;
  };
  errors: Record<string, string>;
  onChange: (updates: any) => void;
  categoryName?: string;
}

export function Step2Story({ formData, errors, onChange, categoryName }: Step2StoryProps) {
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [storySuggestion, setStorySuggestion] = useState<string | null>(null);

  return (
    <div className={WIZARD_SPACING.stepContainer}>
      <InfoAlert icon={Lightbulb}>
        Click the AI button to generate or improve your text
      </InfoAlert>

      {/* Summary Section */}
      <div className={WIZARD_SPACING.cardSection}>
        <div className="flex items-center justify-between">
          <Label htmlFor="summary" className={WIZARD_TYPOGRAPHY.fieldLabel}>
            Short Summary <span className={WIZARD_TYPOGRAPHY.requiredMark}>*</span>
          </Label>
          <AITextEnhancer
            field="summary"
            currentText={formData.summary || ''}
            onTextGenerated={(text) => {
              onChange({ summary: text });
              setSummarySuggestion(null);
            }}
            onSuggestionChange={setSummarySuggestion}
            context={{
              title: formData.title,
              category: categoryName,
              goalAmount: formData.goalAmount,
              beneficiaryName: formData.beneficiaryName,
            }}
          />
        </div>
        <Textarea
          id="summary"
          placeholder="Write a brief, compelling summary that captures the essence of your campaign"
          value={summarySuggestion || formData.summary || ''}
          onChange={(e) => onChange({ summary: e.target.value })}
          className={cn(
            errors.summary && 'border-destructive',
            summarySuggestion && 'border-primary border-2 bg-primary/5'
          )}
          rows={3}
          maxLength={150}
          readOnly={!!summarySuggestion}
        />
        <CharacterCounter
          current={(summarySuggestion || formData.summary || '').length}
          min={10}
          max={150}
          showMinimum
        />
        {errors.summary && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.summary}</p>
        )}
      </div>

      {/* Story Section */}
      <div className={WIZARD_SPACING.cardSection}>
        <div className="flex items-center justify-between">
          <Label htmlFor="story" className={WIZARD_TYPOGRAPHY.fieldLabel}>
            Full Story <span className={WIZARD_TYPOGRAPHY.requiredMark}>*</span>
          </Label>
          <AITextEnhancer
            field="story"
            currentText={formData.story || ''}
            onTextGenerated={(text) => {
              onChange({ story: text });
              setStorySuggestion(null);
            }}
            onSuggestionChange={setStorySuggestion}
            context={{
              title: formData.title,
              category: categoryName,
              goalAmount: formData.goalAmount,
              beneficiaryName: formData.beneficiaryName,
              summary: formData.summary,
            }}
          />
        </div>
        <Textarea
          id="story"
          placeholder="Tell your story in detail. Explain why you're raising funds, how the money will be used, and what impact it will have. Be authentic and specific."
          value={storySuggestion || formData.story || ''}
          onChange={(e) => onChange({ story: e.target.value })}
          className={cn(
            errors.story && 'border-destructive',
            storySuggestion && 'border-primary border-2 bg-primary/5'
          )}
          rows={10}
          maxLength={1000}
          readOnly={!!storySuggestion}
        />
        <CharacterCounter
          current={(storySuggestion || formData.story || '').length}
          min={150}
          max={1000}
          showMinimum
        />
        {errors.story && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.story}</p>
        )}
      </div>

      <TipsBox
        title="Tips for a great story:"
        tips={[
          'Start with who you are and why',
          'Explain the specific need',
          'Describe how funds will be used',
          'Share the expected impact',
        ]}
      />
    </div>
  );
}
