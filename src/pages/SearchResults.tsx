import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useSearch } from "@/hooks/useSearch";
import { useGlobalSearch } from "@/contexts/SearchContext";
import { Heart, User, Building2, ArrowLeft } from "lucide-react";

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'campaign': return <Heart className="h-4 w-4" />;
    case 'user': return <User className="h-4 w-4" />;
    case 'organization': return <Building2 className="h-4 w-4" />;
    default: return <Heart className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'campaign': return 'bg-accent text-accent-foreground';
    case 'user': return 'bg-primary text-primary-foreground';
    case 'organization': return 'bg-secondary text-secondary-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const { searchQuery } = useGlobalSearch();
  
  // Use context search query if available, otherwise fall back to URL param
  const query = searchQuery || searchParams.get('q') || '';
  
  const { results, loading, error, hasMore, loadMore } = useSearch({
    query,
    enabled: !!query
  });

  // Update search query in context when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery && urlQuery !== searchQuery) {
      // Don't update if user is actively typing
    }
  }, [searchParams]);

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  const resultTypes = ['all', ...Array.from(new Set(results.map(r => r.type)))];

  if (!query) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Search Results</h1>
            <p className="text-muted-foreground">No search query provided</p>
            <Button asChild className="mt-4">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Search Results</h1>
              <p className="text-muted-foreground">
                {filteredResults.length} results for "{query}"
              </p>
            </div>
          </div>

          {/* Type Filter */}
          {resultTypes.length > 1 && (
            <div className="flex gap-2 mb-6">
              {resultTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : `${type}s`}
                  {type !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      {results.filter(r => r.type === type).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Results */}
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <Button asChild className="mt-4">
                <Link to="/campaigns">Browse All Campaigns</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result, index) => (
                <Card key={`${result.type}-${result.id}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {result.image && (
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={result.image} alt={result.title} />
                          <AvatarFallback>
                            {getTypeIcon(result.type)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getTypeColor(result.type)} variant="secondary">
                                {getTypeIcon(result.type)}
                                <span className="ml-1 capitalize">{result.type}</span>
                              </Badge>
                              {result.relevanceScore && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(result.relevanceScore * 100)}% match
                                </span>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-1">
                              <Link 
                                to={result.link} 
                                className="hover:text-primary transition-colors"
                                dangerouslySetInnerHTML={{ __html: result.highlightedTitle || result.title }}
                              />
                            </h3>
                            
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {result.subtitle}
                              </p>
                            )}
                            
                            {result.snippet && (
                              <p 
                                className="text-sm text-foreground line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: result.snippet }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {hasMore && (
                <div className="text-center py-6">
                  <Button 
                    onClick={loadMore} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? <LoadingSpinner className="mr-2" /> : null}
                    Load More Results
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}