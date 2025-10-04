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
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          Click the AI button to generate or improve your text. Review the suggestion and accept it if you like it.
        </AlertDescription>
      </Alert>

      {/* Summary Section */}
      <div className="space-y-3">
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
            onSuggestionStateChange={(hasSuggestion) => {
              if (!hasSuggestion) setSummarySuggestion(null);
            }}
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
          current={formData.summary?.length || 0}
          min={10}
          max={150}
          showMinimum
        />
        {errors.summary && (
          <p className="text-sm text-destructive">{errors.summary}</p>
        )}
      </div>

      {/* Story Section */}
      <div className="space-y-3">
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
            onSuggestionStateChange={(hasSuggestion) => {
              if (!hasSuggestion) setStorySuggestion(null);
            }}
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
          current={formData.story?.length || 0}
          min={150}
          max={1000}
          showMinimum
        />
        {errors.story && (
          <p className="text-sm text-destructive">{errors.story}</p>
        )}
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">Tips for a great story:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Start with who you are and why you're fundraising</li>
          <li>Explain the specific need or challenge</li>
          <li>Describe how the funds will be used (be specific)</li>
          <li>Share the expected impact and outcome</li>
          <li>End with a clear call to action</li>
        </ul>
      </div>
    </div>
  );
}
