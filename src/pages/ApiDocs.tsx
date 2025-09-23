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
        {/* Placeholder routes for remaining sections */}
        <Route path="/javascript-examples" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">JavaScript Examples</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/curl-examples" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">cURL Examples</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/explorer" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Interactive API Explorer</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
      </Routes>
    </DocsLayout>
  );
};

export default ApiDocs;