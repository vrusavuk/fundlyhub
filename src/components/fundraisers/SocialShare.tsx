import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Share2, Facebook, Twitter, Copy } from 'lucide-react';

interface SocialShareProps {
  title: string;
  slug: string;
}

export function SocialShare({ title, slug }: SocialShareProps) {
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/fundraiser/${slug}`;

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = `Help support: ${title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Fundraiser link copied to clipboard" });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share this fundraiser
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleFacebookShare}
            className="flex items-center gap-2 hover-scale"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>

          <Button
            variant="outline"
            onClick={handleTwitterShare}
            className="flex items-center gap-2 hover-scale"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex items-center gap-2 hover-scale"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}