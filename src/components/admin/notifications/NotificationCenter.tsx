import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Search, Archive, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  icon: string;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'unread' | 'campaign' | 'donation' | 'social' | 'security';

export function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    const unsubscribe = subscribeToNotifications();
    
    return () => {
      unsubscribe();
    };
  }, [user, showArchived]);

  const fetchNotifications = async () => {
    if (!user) return;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!showArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (ids: string[]) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids);
    
    fetchNotifications();
    setSelectedIds(new Set());
  };

  const archiveNotifications = async (ids: string[]) => {
    await supabase
      .from('notifications')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .in('id', ids);
    
    toast({
      title: 'Notifications Archived',
      description: `${ids.length} notification(s) archived successfully.`
    });
    
    fetchNotifications();
    setSelectedIds(new Set());
  };

  const deleteNotifications = async (ids: string[]) => {
    await supabase
      .from('notifications')
      .delete()
      .in('id', ids);
    
    toast({
      title: 'Notifications Deleted',
      description: `${ids.length} notification(s) deleted successfully.`
    });
    
    fetchNotifications();
    setSelectedIds(new Set());
  };

  const markAllAsRead = async () => {
    const ids = filteredNotifications.filter(n => !n.is_read).map(n => n.id);
    if (ids.length > 0) {
      await markAsRead(ids);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Bell;
    return Icon;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const filterNotifications = (notifications: Notification[]) => {
    let filtered = notifications;

    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'campaign':
        filtered = filtered.filter(n => n.type === 'campaign' || n.type === 'admin');
        break;
      case 'donation':
        filtered = filtered.filter(n => n.type === 'donation');
        break;
      case 'social':
        filtered = filtered.filter(n => n.type === 'social');
        break;
      case 'security':
        filtered = filtered.filter(n => n.type === 'security');
        break;
    }

    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const groupByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Earlier': []
    };

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        groups['Today'].push(notification);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(notification);
      } else if (isThisWeek(date)) {
        groups['This Week'].push(notification);
      } else if (isThisMonth(date)) {
        groups['This Month'].push(notification);
      } else {
        groups['Earlier'].push(notification);
      }
    });

    return groups;
  };

  const filteredNotifications = filterNotifications(notifications);
  const groupedNotifications = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please sign in to view notifications</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">
            All {notifications.length > 0 && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="campaign">Campaigns</TabsTrigger>
          <TabsTrigger value="donation">Donations</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6 space-y-6">
          {selectedIds.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} notification(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(Array.from(selectedIds))}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveNotifications(Array.from(selectedIds))}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotifications(Array.from(selectedIds))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {selectedTab === 'unread' 
                    ? "You're all caught up!" 
                    : "No notifications in this category yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([group, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={group} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
                  {items.map((notification) => {
                    const Icon = getIcon(notification.icon);
                    return (
                      <Card key={notification.id} className={!notification.is_read ? 'border-primary/50' : ''}>
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <Checkbox
                              checked={selectedIds.has(notification.id)}
                              onCheckedChange={() => toggleSelection(notification.id)}
                            />
                            
                            <div className={`mt-1 ${getPriorityColor(notification.priority)}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    {notification.title}
                                    {!notification.is_read && (
                                      <Badge variant="default" className="text-xs">New</Badge>
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                
                                <div className="flex gap-2">
                                  {notification.action_url && (
                                    <Button variant="outline" size="sm" asChild>
                                      <Link to={notification.action_url} onClick={() => !notification.is_read && markAsRead([notification.id])}>
                                        {notification.action_label}
                                      </Link>
                                    </Button>
                                  )}
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead([notification.id])}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => archiveNotifications([notification.id])}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
