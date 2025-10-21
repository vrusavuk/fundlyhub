/**
 * Step 4: Add Milestones (for Structured Projects only)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Calendar, Lightbulb } from 'lucide-react';
import { AITextEnhancer } from './AITextEnhancer';
import { cn } from '@/lib/utils';
import type { Milestone } from '@/lib/validation/fundraiserCreation.schema';

interface Step4MilestonesProps {
  value: Milestone[];
  currency: string;
  onChange: (milestones: Milestone[]) => void;
}

export function Step4Milestones({ value, currency, onChange }: Step4MilestonesProps) {
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    target_amount: 0,
    currency: currency,
    due_date: '',
  });
  const [descriptionSuggestion, setDescriptionSuggestion] = useState<string | null>(null);

  const handleAddMilestone = () => {
    if (!currentMilestone.title || !currentMilestone.target_amount) {
      return;
    }

    onChange([...value, currentMilestone as Milestone]);
    setCurrentMilestone({
      title: '',
      description: '',
      target_amount: 0,
      currency: currency,
      due_date: '',
    });
    setDescriptionSuggestion(null);
  };

  const handleRemoveMilestone = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const totalMilestoneAmount = value.reduce((sum, m) => sum + m.target_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Project Milestones</h2>
        <p className="text-muted-foreground">
          Break down your project into clear milestones with specific goals and timelines
        </p>
      </div>

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          Use AI to generate compelling milestone descriptions that clearly explain what will be accomplished and how funds will be used.
        </AlertDescription>
      </Alert>

      {/* Current milestones */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Added Milestones ({value.length})</h3>
          {value.map((milestone, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base">{milestone.title}</CardTitle>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Goal:</span>{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: milestone.currency,
                      }).format(milestone.target_amount)}
                    </span>
                  </div>
                  {milestone.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(milestone.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <span className="font-medium">Total milestone goals:</span>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
              }).format(totalMilestoneAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Add new milestone form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Milestone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="milestone-title">Milestone Title *</Label>
            <Input
              id="milestone-title"
              placeholder="e.g., Purchase construction materials"
              value={currentMilestone.title}
              onChange={(e) => setCurrentMilestone({ ...currentMilestone, title: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="milestone-description">Description (Optional)</Label>
              <AITextEnhancer
                field="milestone"
                currentText={currentMilestone.description || ''}
                onTextGenerated={(text) => {
                  setCurrentMilestone({ ...currentMilestone, description: text });
                  setDescriptionSuggestion(null);
                }}
                onSuggestionChange={setDescriptionSuggestion}
                context={{
                  milestoneTitle: currentMilestone.title,
                  milestoneAmount: currentMilestone.target_amount,
                }}
              />
            </div>
            <Textarea
              id="milestone-description"
              placeholder="Describe what this milestone will accomplish and how funds will be used..."
              rows={3}
              value={descriptionSuggestion || currentMilestone.description || ''}
              onChange={(e) => setCurrentMilestone({ ...currentMilestone, description: e.target.value })}
              className={cn(
                descriptionSuggestion && 'border-primary border-2 bg-primary/5'
              )}
              readOnly={!!descriptionSuggestion}
              maxLength={300}
            />
            {(descriptionSuggestion || currentMilestone.description) && (
              <p className="text-xs text-muted-foreground text-right">
                {(descriptionSuggestion || currentMilestone.description || '').length}/300 characters
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="milestone-amount">Target Amount *</Label>
              <Input
                id="milestone-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={currentMilestone.target_amount || ''}
                onChange={(e) => setCurrentMilestone({ 
                  ...currentMilestone, 
                  target_amount: parseFloat(e.target.value) || 0 
                })}
              />
            </div>

            <div>
              <Label htmlFor="milestone-date">Due Date (Optional)</Label>
              <Input
                id="milestone-date"
                type="date"
                value={currentMilestone.due_date}
                onChange={(e) => setCurrentMilestone({ ...currentMilestone, due_date: e.target.value })}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddMilestone}
            disabled={!currentMilestone.title || !currentMilestone.target_amount}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
