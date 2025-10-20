import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Heart, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import type { ProjectMilestone } from '@/types/domain/project';

interface ProjectDonationWidgetProps {
  milestones: ProjectMilestone[];
  onDonate: (amount: number, milestoneId?: string, tip?: number) => void;
}

const suggestedAmounts = [25, 50, 100, 250, 500];

export function ProjectDonationWidget({ milestones, onDonate }: ProjectDonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('general');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [showTip, setShowTip] = useState(true);

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const tipAmount = showTip ? (finalAmount * tipPercentage) / 100 : 0;
  const totalAmount = finalAmount + tipAmount;

  const activeMilestones = milestones.filter(m => 
    ['planned', 'in_progress', 'submitted'].includes(m.status)
  );

  const handleDonate = () => {
    onDonate(
      finalAmount,
      selectedMilestone !== 'general' ? selectedMilestone : undefined,
      showTip ? tipAmount : undefined
    );
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Support This Project
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Milestone Selection */}
        {activeMilestones.length > 0 && (
          <div className="space-y-2">
            <Label>Direct your support (optional)</Label>
            <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Project Support</SelectItem>
                {activeMilestones.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a specific milestone or support the project overall
            </p>
          </div>
        )}

        {/* Amount Selection */}
        <div className="space-y-3">
          <Label>Donation Amount</Label>
          <div className="grid grid-cols-3 gap-2">
            {suggestedAmounts.map(amount => (
              <Button
                key={amount}
                variant={selectedAmount === amount && !customAmount ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className="w-full"
              >
                ${amount}
              </Button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-7"
            />
          </div>
        </div>

        {/* Tip Section */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="tip-toggle" className="cursor-pointer">
                Support FundlyHub
              </Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Switch
              id="tip-toggle"
              checked={showTip}
              onCheckedChange={setShowTip}
            />
          </div>
          
          {showTip && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip amount</span>
                  <span className="font-medium">{tipPercentage}% ({formatCurrency(tipAmount)})</span>
                </div>
                <Slider
                  value={[tipPercentage]}
                  onValueChange={([v]) => setTipPercentage(v)}
                  min={0}
                  max={20}
                  step={5}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your tip helps us maintain the platform and support more projects
              </p>
            </>
          )}
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleDonate}
            disabled={!finalAmount || finalAmount <= 0}
          >
            <Heart className="h-4 w-4 mr-2" />
            Donate {formatCurrency(totalAmount)}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          100% of your donation goes to the project
        </p>
      </CardContent>
    </Card>
  );
}
