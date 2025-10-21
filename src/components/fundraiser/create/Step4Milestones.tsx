/**
 * Step 4: Add Milestones (Inline Editing Pattern)
 * Allows users to add and edit milestones directly in the list
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Edit2, Check } from 'lucide-react';
import { Milestone } from '@/lib/validation/fundraiserCreation.schema';
import { useAITextEnhancer } from '@/hooks/useAITextEnhancer';

interface Step4MilestonesProps {
  value: Milestone[];
  currency: string;
  onChange: (milestones: Milestone[]) => void;
}

export function Step4Milestones({ value, currency, onChange }: Step4MilestonesProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { enhanceText, isEnhancing } = useAITextEnhancer();

  const handleAddNew = () => {
    const newMilestone: Partial<Milestone> = {
      title: '',
      description: '',
      target_amount: 0,
      currency: currency,
      due_date: undefined,
    };
    onChange([...value, newMilestone as Milestone]);
    setEditingIndex(value.length);
  };

  const handleUpdate = (index: number, field: keyof Milestone, fieldValue: any) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleEnhanceDescription = async (index: number, description: string) => {
    if (!description.trim()) return;

    const milestone = value[index];
    const context = `Milestone: ${milestone.title}\nTarget Amount: ${milestone.currency} ${milestone.target_amount}`;
    
    const enhanced = await enhanceText(description, 'description', context);
    if (enhanced) {
      handleUpdate(index, 'description', enhanced);
    }
  };

  const isValidMilestone = (milestone: Milestone) => {
    return milestone.title && milestone.title.trim().length > 0 && milestone.target_amount > 0;
  };

  const totalMilestoneGoals = value.reduce((sum, m) => sum + (m.target_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Milestones</h3>
        <p className="text-sm text-muted-foreground">
          Define the key milestones for your project. Each milestone should have a clear goal and deliverable.
        </p>
      </div>

      {value.length > 0 && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Click on any milestone to edit it. Use AI to enhance descriptions for clarity.
          </AlertDescription>
        </Alert>
      )}

      {/* Milestones List */}
      {value.length > 0 && (
        <div className="space-y-4">
          {value.map((milestone, index) => {
            const isEditing = editingIndex === index;
            const isValid = isValidMilestone(milestone);

            return (
              <Card 
                key={index} 
                className={`transition-all ${
                  !isValid ? 'border-warning border-2' : isValid ? 'border-success/30' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      {isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                      )}
                      <CardTitle className="text-base">
                        Milestone {index + 1}
                        {!isValid && <span className="text-warning text-sm ml-2">(Incomplete)</span>}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`title-${index}`}>
                          Milestone Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`title-${index}`}
                          value={milestone.title || ''}
                          onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                          placeholder="e.g., Complete prototype development"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <div className="space-y-2">
                          <Textarea
                            id={`description-${index}`}
                            value={milestone.description || ''}
                            onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                            placeholder="Describe what will be achieved in this milestone..."
                            rows={3}
                            maxLength={500}
                          />
                          {milestone.description && milestone.description.length > 10 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnhanceDescription(index, milestone.description || '')}
                              disabled={isEnhancing}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`amount-${index}`}>
                            Target Amount ({currency}) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={milestone.target_amount || ''}
                            onChange={(e) => handleUpdate(index, 'target_amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`date-${index}`}>Due Date (Optional)</Label>
                          <Input
                            id={`date-${index}`}
                            type="date"
                            value={milestone.due_date || ''}
                            onChange={(e) => handleUpdate(index, 'due_date', e.target.value || undefined)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(null)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Done Editing
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-base mb-1">
                          {milestone.title || <span className="text-muted-foreground italic">No title</span>}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-semibold text-primary">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: milestone.currency,
                            }).format(milestone.target_amount || 0)}
                          </span>
                        </div>
                        {milestone.due_date && (
                          <div>
                            <span className="text-muted-foreground">Due: </span>
                            <span className="font-medium">
                              {new Date(milestone.due_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {value.length > 0 && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium flex items-center justify-between">
                <span>Total Milestone Goals:</span>
                <span className="text-primary text-lg">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(totalMilestoneGoals)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="flex items-center justify-center py-8">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleAddNew}
            className="text-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Milestone
          </Button>
        </CardContent>
      </Card>

      {value.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add at least one milestone to continue. Click "Add New Milestone" to get started.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
