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
import { Plus, Trash2, CheckCircle2, AlertCircle, Edit2, Check, Sparkles } from 'lucide-react';
import { Milestone } from '@/lib/validation/fundraiserCreation.schema';
import { AITextEnhancer } from './AITextEnhancer';
import { InfoAlert } from './InfoAlert';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY, WIZARD_ICONS, WIZARD_GAPS } from './designConstants';

interface Step4MilestonesProps {
  value: Milestone[];
  currency: string;
  onChange: (milestones: Milestone[]) => void;
}

export function Step4Milestones({ value, currency, onChange }: Step4MilestonesProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<Record<number, string | null>>({});

  const getTextareaHeight = (text: string | null | undefined, hasAISuggestion: boolean): string => {
    if (!hasAISuggestion || !text) return 'auto';
    const estimatedRows = Math.ceil(text.length / 80);
    const rows = Math.min(10, Math.max(3, estimatedRows));
    const height = (rows * 24) + 24;
    return `${height}px`;
  };

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
    const newSuggestions = { ...descriptionSuggestions };
    delete newSuggestions[index];
    setDescriptionSuggestions(newSuggestions);
  };

  const isValidMilestone = (milestone: Milestone) => {
    return milestone.title && milestone.title.trim().length > 0 && milestone.target_amount > 0;
  };

  const totalMilestoneGoals = value.reduce((sum, m) => sum + (m.target_amount || 0), 0);

  return (
    <div className={WIZARD_SPACING.stepContainer}>
      <div>
        <h3 className={WIZARD_TYPOGRAPHY.sectionTitle}>Project Milestones</h3>
        <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground mt-1`}>
          Define key milestones with clear goals
        </p>
      </div>

      {value.length > 0 && (
        <InfoAlert icon={Sparkles}>
          Click any milestone to edit. Use AI to enhance descriptions.
        </InfoAlert>
      )}

      {/* Milestones List */}
      {value.length > 0 && (
        <div className={WIZARD_SPACING.cardSection}>
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
                <CardHeader className="pb-2">
                  <div className={`flex items-start justify-between ${WIZARD_GAPS.standard}`}>
                    <div className={`flex items-center ${WIZARD_GAPS.tight} flex-1`}>
                      {isValid ? (
                        <CheckCircle2 className={`${WIZARD_ICONS.standard} text-success flex-shrink-0`} />
                      ) : (
                        <AlertCircle className={`${WIZARD_ICONS.standard} text-warning flex-shrink-0`} />
                      )}
                      <CardTitle className={WIZARD_TYPOGRAPHY.subsectionTitle}>
                        Milestone {index + 1}
                        {!isValid && <span className={`text-warning ${WIZARD_TYPOGRAPHY.helperText} ml-1.5`}>(Incomplete)</span>}
                      </CardTitle>
                    </div>
                    <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                      {!isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className={WIZARD_ICONS.standard} />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className={WIZARD_ICONS.standard} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={WIZARD_SPACING.cardSection}>
                  {isEditing ? (
                    <>
                      <div className={WIZARD_SPACING.fieldGroup}>
                        <Label htmlFor={`title-${index}`} className={WIZARD_TYPOGRAPHY.fieldLabel}>
                          Milestone Title <span className={WIZARD_TYPOGRAPHY.requiredMark}>*</span>
                        </Label>
                        <Input
                          id={`title-${index}`}
                          value={milestone.title || ''}
                          onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                          placeholder="e.g., Complete prototype development"
                          maxLength={100}
                        />
                      </div>

                      <div className={WIZARD_SPACING.fieldGroup}>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`description-${index}`} className={WIZARD_TYPOGRAPHY.fieldLabel}>Description</Label>
                          <AITextEnhancer
                            field="milestone"
                            currentText={milestone.description || ''}
                            onTextGenerated={(text) => {
                              handleUpdate(index, 'description', text);
                              setDescriptionSuggestions({ ...descriptionSuggestions, [index]: null });
                            }}
                            onSuggestionChange={(suggestion) => {
                              setDescriptionSuggestions({ ...descriptionSuggestions, [index]: suggestion });
                            }}
                            context={{
                              milestoneTitle: milestone.title,
                              milestoneAmount: milestone.target_amount,
                            }}
                          />
                        </div>
                        <Textarea
                          id={`description-${index}`}
                          value={descriptionSuggestions[index] || milestone.description || ''}
                          onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                          placeholder="Describe what will be achieved in this milestone..."
                          style={{ 
                            minHeight: getTextareaHeight(
                              descriptionSuggestions[index] || milestone.description,
                              !!descriptionSuggestions[index]
                            )
                          }}
                          maxLength={500}
                          readOnly={!!descriptionSuggestions[index]}
                          className={descriptionSuggestions[index] ? 'border-primary border-2 bg-primary/5' : ''}
                        />
                      </div>

                      <div className={`grid grid-cols-1 md:grid-cols-2 ${WIZARD_GAPS.standard}`}>
                        <div className={WIZARD_SPACING.fieldGroup}>
                          <Label htmlFor={`amount-${index}`} className={WIZARD_TYPOGRAPHY.fieldLabel}>
                            Target Amount ({currency}) <span className={WIZARD_TYPOGRAPHY.requiredMark}>*</span>
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

                        <div className={WIZARD_SPACING.fieldGroup}>
                          <Label htmlFor={`date-${index}`} className={WIZARD_TYPOGRAPHY.fieldLabel}>Due Date (Optional)</Label>
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
                          <Check className={`${WIZARD_ICONS.standard} mr-2`} />
                          Done Editing
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={WIZARD_SPACING.cardSubsection}>
                      <div>
                        <h4 className={`${WIZARD_TYPOGRAPHY.subsectionTitle} mb-1`}>
                          {milestone.title || <span className="text-muted-foreground italic">No title</span>}
                        </h4>
                        {milestone.description && (
                          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground whitespace-pre-wrap`}>
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      <div className={`flex flex-wrap items-center ${WIZARD_GAPS.standard} ${WIZARD_TYPOGRAPHY.bodyText}`}>
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
              <p className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium flex items-center justify-between`}>
                <span>Total Goals:</span>
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
            <Plus className={`${WIZARD_ICONS.standard} mr-2`} />
            Add New Milestone
          </Button>
        </CardContent>
      </Card>

      {value.length === 0 && (
        <InfoAlert icon={AlertCircle} variant="warning">
          Add at least one milestone to continue
        </InfoAlert>
      )}
    </div>
  );
}
