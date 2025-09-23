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

const ApiDocs = () => {
  return (
    <DocsLayout>
      <Routes>
        <Route path="/" element={<DocsOverview />} />
        <Route path="/quick-start" element={<DocsQuickStart />} />
        <Route path="/authentication" element={<DocsAuthentication />} />
        <Route path="/rate-limits" element={<DocsRateLimits />} />
        <Route path="/fundraisers" element={<DocsFundraisers />} />
        {/* Placeholder routes for other sections */}
        <Route path="/categories" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Categories API</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/profiles" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">User Profiles API</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/organizations" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Organizations API</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/donations" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Donations API</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/search" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Search API</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/javascript-examples" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">JavaScript Examples</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/curl-examples" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">cURL Examples</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
        <Route path="/explorer" element={<div className="max-w-4xl"><h1 className="text-4xl font-bold mb-4">Interactive API Explorer</h1><p className="text-muted-foreground">Documentation coming soon...</p></div>} />
      </Routes>
    </DocsLayout>
  );
};

export default ApiDocs;