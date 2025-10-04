/**
 * Step 2: Story
 * Summary and Story with AI Enhancement
 */

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AITextEnhancer } from './AITextEnhancer';
import { CharacterCounter } from './CharacterCounter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          Use AI to help craft compelling text that resonates with donors. The AI considers
          your campaign details to generate contextual, emotional content.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label htmlFor="summary" className="label-small">
          Short Summary <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="summary"
          placeholder="Write a brief, compelling summary that captures the essence of your campaign"
          value={formData.summary || ''}
          onChange={(e) => onChange({ summary: e.target.value })}
          className={errors.summary ? 'border-destructive' : ''}
          rows={3}
          maxLength={150}
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
        
        <AITextEnhancer
          field="summary"
          currentText={formData.summary || ''}
          onTextGenerated={(text) => onChange({ summary: text })}
          context={{
            title: formData.title,
            category: categoryName,
            goalAmount: formData.goalAmount,
            beneficiaryName: formData.beneficiaryName,
          }}
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="story" className="label-small">
          Full Story <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="story"
          placeholder="Tell your story in detail. Explain why you're raising funds, how the money will be used, and what impact it will have. Be authentic and specific."
          value={formData.story || ''}
          onChange={(e) => onChange({ story: e.target.value })}
          className={errors.story ? 'border-destructive' : ''}
          rows={10}
          maxLength={1000}
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
        
        <AITextEnhancer
          field="story"
          currentText={formData.story || ''}
          onTextGenerated={(text) => onChange({ story: text })}
          context={{
            title: formData.title,
            category: categoryName,
            goalAmount: formData.goalAmount,
            beneficiaryName: formData.beneficiaryName,
            summary: formData.summary,
          }}
        />
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
