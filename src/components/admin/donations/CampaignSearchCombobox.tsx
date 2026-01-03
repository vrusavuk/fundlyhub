import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
  placeholder = 'Search and select a campaign...',
  disabled = false,
}: CampaignSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns - use campaign_summary_projection as source of truth
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!open) return; // Only fetch when dropdown is open
      
      setLoading(true);
      try {
        // Use campaign_summary_projection as single source of truth (admin RLS policy now allows access)
        let query = supabase
          .from('campaign_summary_projection')
          .select('campaign_id, title, slug, status, goal_amount, total_raised, owner_name')
          .eq('status', 'active')
          .order('title', { ascending: true })
          .limit(50);

        // Filter by search term
        if (search.trim()) {
          query = query.ilike('title', `%${search.trim()}%`);
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
            status: c.status || 'active',
            goal_amount: c.goal_amount,
            total_raised: c.total_raised || 0,
            owner_name: c.owner_name || null,
          }))
        );
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [search, excludeCampaignId, open]);

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
            status: data.status || 'active',
            goal_amount: data.goal_amount,
            total_raised: data.total_raised || 0,
            owner_name: data.owner_name || null,
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

  const handleSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    onChange(campaign.id, campaign);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
          disabled={disabled}
        >
          {selectedCampaign ? (
            <span className="truncate text-left">{selectedCampaign.title}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 bg-popover z-50" 
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search campaigns..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <CommandEmpty>
                {search.trim() ? 'No campaigns found.' : 'No active campaigns available.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {campaigns.map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    value={campaign.title}
                    onSelect={() => handleSelect(campaign)}
                    className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === campaign.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-medium truncate">
                          {campaign.title}
                        </span>
                      </div>
                      <StripeBadgeExact variant={getStatusBadge(campaign.status)} className="shrink-0">
                        {campaign.status}
                      </StripeBadgeExact>
                    </div>
                    <div className="ml-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {MoneyMath.format(MoneyMath.create(campaign.total_raised, 'USD'))} raised
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        Goal: {MoneyMath.format(MoneyMath.create(campaign.goal_amount, 'USD'))}
                      </span>
                      {campaign.owner_name && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">by {campaign.owner_name}</span>
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
