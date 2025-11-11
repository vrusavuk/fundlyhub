/**
 * Step 2: Story
 * Summary and Story with AI Enhancement
 */

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AITextEnhancer } from './AITextEnhancer';
import { CharacterCounter } from './CharacterCounter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="space-y-4">
      <Alert className="p-3">
        <Lightbulb className="h-3.5 w-3.5" />
        <AlertDescription className="text-xs sm:text-sm">
          Click the AI button to generate or improve your text
        </AlertDescription>
      </Alert>

      {/* Summary Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="summary" className="label-small">
            Short Summary <span className="text-destructive">*</span>
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
          <p className="text-sm text-destructive">{errors.summary}</p>
        )}
      </div>

      {/* Story Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="story" className="label-small">
            Full Story <span className="text-destructive">*</span>
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
          <p className="text-sm text-destructive">{errors.story}</p>
        )}
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-3">
        <h4 className="font-medium text-xs sm:text-sm mb-1.5">Tips for a great story:</h4>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>Start with who you are and why</li>
          <li>Explain the specific need</li>
          <li>Describe how funds will be used</li>
          <li>Share the expected impact</li>
        </ul>
      </div>
    </div>
  );
}
