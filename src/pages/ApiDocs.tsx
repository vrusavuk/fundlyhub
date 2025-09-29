/**
 * API Documentation router component
 */
import { Routes, Route } from "react-router-dom";
import { DocsLayout } from "./docs/DocsLayout";
import { DocsOverview } from "./docs/Overview";
import { DocsQuickStart } from "./docs/QuickStart";
import { DocsAuthentication } from "./docs/Authentication";
import { DocsRateLimits } from "./docs/RateLimits";
import { DocsFundraisers } from "./docs/Fundraisers";
import { DocsCategories } from "./docs/Categories";
import { DocsProfiles } from "./docs/Profiles";
import { DocsOrganizations } from "./docs/Organizations";
import { DocsDonations } from "./docs/Donations";
import { DocsSearch } from "./docs/Search";
import { DocsJavaScriptExamples } from "./docs/JavaScriptExamples";
import { DocsCurlExamples } from "./docs/CurlExamples";
import { DocsApiExplorer } from "./docs/ApiExplorer";
import { EventsOverview } from "./docs/EventsOverview";
import { EventsUserEvents } from "./docs/EventsUserEvents";
import { EventsCampaignEvents } from "./docs/EventsCampaignEvents";
import { EventsDonationEvents } from "./docs/EventsDonationEvents";
import { EventsOrganizationEvents } from "./docs/EventsOrganizationEvents";
import { EventsAdminEvents } from "./docs/EventsAdminEvents";
import { EventsExplorer } from "./docs/EventsExplorer";

const ApiDocs = () => {
  return (
    <DocsLayout>
      <Routes>
        <Route path="/" element={<DocsOverview />} />
        <Route path="/quick-start" element={<DocsQuickStart />} />
        <Route path="/authentication" element={<DocsAuthentication />} />
        <Route path="/rate-limits" element={<DocsRateLimits />} />
        <Route path="/fundraisers" element={<DocsFundraisers />} />
        <Route path="/categories" element={<DocsCategories />} />
        <Route path="/profiles" element={<DocsProfiles />} />
        <Route path="/organizations" element={<DocsOrganizations />} />
        <Route path="/donations" element={<DocsDonations />} />
        <Route path="/search" element={<DocsSearch />} />
        <Route path="/events" element={<EventsOverview />} />
        <Route path="/events/user-events" element={<EventsUserEvents />} />
        <Route path="/events/campaign-events" element={<EventsCampaignEvents />} />
        <Route path="/events/donation-events" element={<EventsDonationEvents />} />
        <Route path="/events/organization-events" element={<EventsOrganizationEvents />} />
        <Route path="/events/admin-events" element={<EventsAdminEvents />} />
        <Route path="/events/explorer" element={<EventsExplorer />} />
        <Route path="/javascript-examples" element={<DocsJavaScriptExamples />} />
        <Route path="/curl-examples" element={<DocsCurlExamples />} />
        <Route path="/explorer" element={<DocsApiExplorer />} />
      </Routes>
    </DocsLayout>
  );
};

export default ApiDocs;