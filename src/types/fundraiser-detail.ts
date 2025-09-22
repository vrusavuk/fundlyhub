export interface Fundraiser {
  id: string;
  title: string;
  slug: string;
  summary: string;
  story_html: string;
  goal_amount: number;
  currency: string;
  category: string;
  cover_image: string;
  beneficiary_name: string;
  location: string;
  status: string;
  created_at: string;
  owner_user_id: string;
  org_id: string | null;
  profiles: {
    id: string;
    name: string;
  } | null;
  organizations: {
    id: string;
    legal_name: string;
    dba_name: string;
  } | null;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

export interface FundraiserDetailData {
  fundraiser: Fundraiser | null;
  donations: Donation[];
  comments: Comment[];
  totalRaised: number;
  loading: boolean;
}