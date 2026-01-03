import { useState, useEffect, useCallback } from 'react';
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

  // Fetch campaigns from fundraisers (source of truth) + get_fundraiser_totals for accurate totals
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      // Query fundraisers directly as source of truth
      let query = supabase
        .from('fundraisers')
        .select(`
          id,
          title,
          slug,
          status,
          goal_amount,
          owner:profiles!owner_user_id(name)
        `)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('title', { ascending: true })
        .limit(50);

      // Filter by search term
      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      // Exclude current campaign
      if (excludeCampaignId) {
        query = query.neq('id', excludeCampaignId);
      }

      const { data: fundraisers, error } = await query;

      if (error) throw error;

      if (!fundraisers || fundraisers.length === 0) {
        setCampaigns([]);
        return;
      }

      // Get accurate totals using the canonical RPC
      const campaignIds = fundraisers.map((f) => f.id);
      const { data: totals } = await supabase.rpc('get_fundraiser_totals', {
        fundraiser_ids: campaignIds,
      });

      // Create a map of totals by fundraiser_id
      const totalsMap = new Map(
        (totals || []).map((t: { fundraiser_id: string; total_raised: number }) => [
          t.fundraiser_id,
          t.total_raised || 0,
        ])
      );

      // Merge campaigns with totals
      setCampaigns(
        fundraisers.map((f) => ({
          id: f.id,
          title: f.title,
          slug: f.slug,
          status: f.status || 'active',
          goal_amount: f.goal_amount,
          total_raised: totalsMap.get(f.id) || 0,
          owner_name: (f.owner as { name: string } | null)?.name || null,
        }))
      );
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [search, excludeCampaignId]);

  // Fetch campaigns when popover opens or search changes
  useEffect(() => {
    if (open) {
      fetchCampaigns();
    }
  }, [open, fetchCampaigns]);

  // Also refetch when search changes (debounced effect handled by dependency)
  useEffect(() => {
    if (open && search !== undefined) {
      const timer = setTimeout(() => {
        fetchCampaigns();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, open, fetchCampaigns]);

  // Fetch selected campaign details when value changes
  useEffect(() => {
    if (value && (!selectedCampaign || selectedCampaign.id !== value)) {
      const fetchSelected = async () => {
        // First get campaign details
        const { data: campaign } = await supabase
          .from('fundraisers')
          .select(`
            id,
            title,
            slug,
            status,
            goal_amount,
            owner:profiles!owner_user_id(name)
          `)
          .eq('id', value)
          .maybeSingle();

        if (campaign) {
          // Get accurate totals
          const { data: totals } = await supabase.rpc('get_fundraiser_totals', {
            fundraiser_ids: [campaign.id],
          });

          const total = totals?.[0]?.total_raised || 0;

          setSelectedCampaign({
            id: campaign.id,
            title: campaign.title,
            slug: campaign.slug,
            status: campaign.status || 'active',
            goal_amount: campaign.goal_amount,
            total_raised: total,
            owner_name: (campaign.owner as { name: string } | null)?.name || null,
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset search when opening to show all campaigns
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[400px] p-0 bg-popover border border-border shadow-lg z-50 overflow-hidden" 
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            placeholder="Search campaigns..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[40vh] sm:max-h-[300px] overflow-y-auto">
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
                  <div
                    key={campaign.id}
                    role="option"
                    aria-selected={value === campaign.id}
                    onClick={() => handleSelect(campaign)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                      "flex flex-col items-start gap-1 py-3 px-2 cursor-pointer w-full",
                      "hover:bg-accent hover:text-accent-foreground",
                      "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                      value === campaign.id && "bg-accent text-accent-foreground"
                    )}
                    data-selected={value === campaign.id}
                  >
                    <div className="flex w-full items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === campaign.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-medium truncate block max-w-full">
                          {campaign.title}
                        </span>
                      </div>
                      <StripeBadgeExact variant={getStatusBadge(campaign.status)} className="shrink-0">
                        {campaign.status}
                      </StripeBadgeExact>
                    </div>
                    <div className="ml-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground w-full overflow-hidden">
                      <span className="truncate">
                        {MoneyMath.format(MoneyMath.create(campaign.total_raised, 'USD'))} raised
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline truncate">
                        Goal: {MoneyMath.format(MoneyMath.create(campaign.goal_amount, 'USD'))}
                      </span>
                      {campaign.owner_name && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline truncate">by {campaign.owner_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
