import sampleCampaign1 from "@/assets/sample-campaign-1.jpg";
import sampleCampaign2 from "@/assets/sample-campaign-2.jpg";
import sampleCampaign3 from "@/assets/sample-campaign-3.jpg";

export interface Fundraiser {
  id: string;
  title: string;
  summary: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  coverImage: string;
  category: string;
  isVerified: boolean;
  organizationName?: string;
  donorCount: number;
  daysLeft?: number;
}

export const featuredFundraisers: Fundraiser[] = [
  {
    id: "1",
    title: "Help Build Clean Water Wells in Rural Communities",
    summary: "Bringing safe, clean drinking water to remote villages that have been without access for generations.",
    goalAmount: 50000,
    raisedAmount: 42750,
    currency: "USD",
    coverImage: sampleCampaign1,
    category: "Community",
    isVerified: true,
    organizationName: "Water for All Foundation",
    donorCount: 892,
    daysLeft: 12,
  },
  {
    id: "2",
    title: "STEM Education Program for Underserved Schools",
    summary: "Providing coding classes, robotics kits, and technology access to students in low-income neighborhoods.",
    goalAmount: 25000,
    raisedAmount: 18500,
    currency: "USD",
    coverImage: sampleCampaign2,
    category: "Education",
    isVerified: true,
    organizationName: "Future Coders Inc",
    donorCount: 324,
    daysLeft: 25,
  },
  {
    id: "3",
    title: "Emergency Medical Fund for Hurricane Survivors",
    summary: "Supporting families affected by recent hurricane with immediate medical care and prescription medications.",
    goalAmount: 75000,
    raisedAmount: 67200,
    currency: "USD",
    coverImage: sampleCampaign3,
    category: "Medical",
    isVerified: true,
    organizationName: "Red Cross Emergency Response",
    donorCount: 1456,
    daysLeft: 8,
  },
  {
    id: "4",
    title: "Save the Local Animal Shelter",
    summary: "Our community animal shelter needs urgent funding to continue operations and care for over 200 animals.",
    goalAmount: 35000,
    raisedAmount: 22100,
    currency: "USD",
    coverImage: sampleCampaign1,
    category: "Animals",
    isVerified: false,
    organizationName: "Sunny Days Animal Rescue",
    donorCount: 445,
    daysLeft: 18,
  },
  {
    id: "5",
    title: "Homeless Youth Outreach Program",
    summary: "Providing meals, shelter, and job training to homeless youth in our city during the winter months.",
    goalAmount: 40000,
    raisedAmount: 31750,
    currency: "USD",
    coverImage: sampleCampaign2,
    category: "Community",
    isVerified: true,
    organizationName: "Hope Haven Services",
    donorCount: 672,
    daysLeft: 20,
  },
  {
    id: "6",
    title: "Cancer Treatment Support for Sarah",
    summary: "Help Sarah fight her battle against cancer by covering medical expenses not covered by insurance.",
    goalAmount: 100000,
    raisedAmount: 78500,
    currency: "USD",
    coverImage: sampleCampaign3,
    category: "Medical",
    isVerified: false,
    donorCount: 1823,
    daysLeft: 45,
  },
];