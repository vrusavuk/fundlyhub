import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { StripeBadgeExact } from '@/components/ui/stripe-badge-exact';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';

interface Campaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  goal_amount: number;
  total_raised: number;
  owner_name: string | null;
}

interface CampaignSearchComboboxProps {
  value: string | null;
  onChange: (campaignId: string | null, campaign: Campaign | null) => void;
  excludeCampaignId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CampaignSearchCombobox({
  value,
  onChange,
  excludeCampaignId,
  placeholder = 'Select campaign...',
  disabled = false,
}: CampaignSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns on search
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('campaign_summary_projection')
          .select('campaign_id, title, slug, status, goal_amount, total_raised, owner_name')
          .order('title', { ascending: true })
          .limit(50);

        // Filter by search term
        if (search) {
          query = query.ilike('title', `%${search}%`);
        }

        // Exclude current campaign
        if (excludeCampaignId) {
          query = query.neq('campaign_id', excludeCampaignId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setCampaigns(
          (data || []).map((c) => ({
            id: c.campaign_id,
            title: c.title,
            slug: c.slug,
            status: c.status,
            goal_amount: c.goal_amount,
            total_raised: c.total_raised || 0,
            owner_name: c.owner_name,
          }))
        );
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [search, excludeCampaignId]);

  // Fetch selected campaign details when value changes
  useEffect(() => {
    if (value && !selectedCampaign) {
      const fetchSelected = async () => {
        const { data } = await supabase
          .from('campaign_summary_projection')
          .select('campaign_id, title, slug, status, goal_amount, total_raised, owner_name')
          .eq('campaign_id', value)
          .single();

        if (data) {
          setSelectedCampaign({
            id: data.campaign_id,
            title: data.title,
            slug: data.slug,
            status: data.status,
            goal_amount: data.goal_amount,
            total_raised: data.total_raised || 0,
            owner_name: data.owner_name,
          });
        }
      };
      fetchSelected();
    }
  }, [value, selectedCampaign]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      active: 'success',
      pending: 'warning',
      draft: 'neutral',
      paused: 'warning',
      closed: 'neutral',
      ended: 'neutral',
    };
    return variants[status] || 'neutral';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCampaign ? (
            <span className="truncate">{selectedCampaign.title}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search campaigns..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <CommandEmpty>No campaigns found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {campaigns.map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    value={campaign.id}
                    onSelect={() => {
                      const newValue = campaign.id === value ? null : campaign.id;
                      const newCampaign = campaign.id === value ? null : campaign;
                      setSelectedCampaign(newCampaign);
                      onChange(newValue, newCampaign);
                      setOpen(false);
                    }}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            'h-4 w-4',
                            value === campaign.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-medium truncate max-w-[250px]">
                          {campaign.title}
                        </span>
                      </div>
                      <StripeBadgeExact variant={getStatusBadge(campaign.status)}>
                        {campaign.status}
                      </StripeBadgeExact>
                    </div>
                    <div className="ml-6 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {MoneyMath.format(MoneyMath.create(campaign.total_raised, 'USD'))} raised
                      </span>
                      <span>•</span>
                      <span>
                        Goal: {MoneyMath.format(MoneyMath.create(campaign.goal_amount, 'USD'))}
                      </span>
                      {campaign.owner_name && (
                        <>
                          <span>•</span>
                          <span>by {campaign.owner_name}</span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
