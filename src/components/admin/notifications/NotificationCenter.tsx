import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Users,
  Send,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'system' | 'user' | 'campaign' | 'donation' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  recipient?: string;
  recipientType: 'user' | 'role' | 'all';
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  createdAt: string;
  scheduledFor?: string;
  readBy?: string[];
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline';
}

interface CreateNotificationData {
  type: Notification['type'];
  priority: Notification['priority'];
  title: string;
  message: string;
  recipientType: Notification['recipientType'];
  recipient?: string;
  scheduledFor?: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'sent' | 'scheduled'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState<CreateNotificationData>({
    type: 'system',
    priority: 'medium',
    title: '',
    message: '',
    recipientType: 'all'
  });
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'system',
        priority: 'high',
        title: 'System Maintenance Scheduled',
        message: 'Platform will undergo maintenance on Sunday at 2 AM EST. Expected downtime: 2 hours.',
        recipientType: 'all',
        status: 'sent',
        createdAt: '2024-01-15T10:30:00Z',
        readBy: ['user1', 'user2']
      },
      {
        id: '2',
        type: 'campaign',
        priority: 'medium',
        title: 'Campaign Approval Required',
        message: 'Medical campaign "Help Sarah Fight Cancer" requires admin review and approval.',
        recipientType: 'role',
        recipient: 'admin',
        status: 'sent',
        createdAt: '2024-01-15T09:15:00Z',
        actions: [
          { label: 'Review Campaign', action: 'review_campaign', variant: 'default' },
          { label: 'Approve', action: 'approve_campaign', variant: 'default' },
          { label: 'Reject', action: 'reject_campaign', variant: 'destructive' }
        ]
      },
      {
        id: '3',
        type: 'donation',
        priority: 'low',
        title: 'Large Donation Alert',
        message: 'A donation of $5,000 was made to "Emergency Relief Fund" campaign.',
        recipientType: 'role',
        recipient: 'financial_admin',
        status: 'sent',
        createdAt: '2024-01-15T08:45:00Z'
      },
      {
        id: '4',
        type: 'user',
        priority: 'urgent',
        title: 'Account Security Alert',
        message: 'Multiple failed login attempts detected for user john.doe@example.com.',
        recipientType: 'role',
        recipient: 'security_admin',
        status: 'sent',
        createdAt: '2024-01-15T08:00:00Z',
        actions: [
          { label: 'Lock Account', action: 'lock_account', variant: 'destructive' },
          { label: 'Reset Password', action: 'reset_password', variant: 'outline' }
        ]
      },
      {
        id: '5',
        type: 'system',
        priority: 'medium',
        title: 'Weekly Report Ready',
        message: 'Your weekly analytics report is ready for download.',
        recipientType: 'all',
        status: 'scheduled',
        createdAt: '2024-01-15T07:30:00Z',
        scheduledFor: '2024-01-16T09:00:00Z'
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.readBy?.length;
      case 'sent':
        return notification.status === 'sent';
      case 'scheduled':
        return notification.status === 'scheduled';
      default:
        return true;
    }
  });

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'system': return <Settings className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'campaign': return <MessageSquare className="h-4 w-4" />;
      case 'donation': return <CheckCircle className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const createNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const notification: Notification = {
        id: Date.now().toString(),
        ...newNotification,
        status: newNotification.scheduledFor ? 'scheduled' : 'sent',
        createdAt: new Date().toISOString(),
        readBy: []
      };

      setNotifications(prev => [notification, ...prev]);
      setCreateDialogOpen(false);
      setNewNotification({
        type: 'system',
        priority: 'medium',
        title: '',
        message: '',
        recipientType: 'all'
      });

      toast({
        title: 'Notification Created',
        description: `Notification ${newNotification.scheduledFor ? 'scheduled' : 'sent'} successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create notification',
        variant: 'destructive'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, readBy: [...(notification.readBy || []), 'current_user'] }
        : notification
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast({
      title: 'Notification Deleted',
      description: 'Notification has been removed successfully'
    });
  };

  const handleNotificationAction = (notificationId: string, action: string) => {
    toast({
      title: 'Action Executed',
      description: `Action "${action}" has been executed for notification`
    });
    
    // Mark as read when action is taken
    markAsRead(notificationId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Center</h2>
          <p className="text-muted-foreground">
            Manage system notifications and communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Send notifications to users or schedule them for later
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select 
                      value={newNotification.type} 
                      onValueChange={(value: Notification['type']) => 
                        setNewNotification(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select 
                      value={newNotification.priority} 
                      onValueChange={(value: Notification['priority']) => 
                        setNewNotification(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipients</label>
                    <Select 
                      value={newNotification.recipientType} 
                      onValueChange={(value: Notification['recipientType']) => 
                        setNewNotification(prev => ({ ...prev, recipientType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="role">Specific Role</SelectItem>
                        <SelectItem value="user">Specific User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newNotification.recipientType !== 'all' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {newNotification.recipientType === 'role' ? 'Role' : 'User'}
                      </label>
                      <Input
                        value={newNotification.recipient || ''}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, recipient: e.target.value }))}
                        placeholder={newNotification.recipientType === 'role' ? 'admin, moderator, etc.' : 'user@example.com'}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule For (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={newNotification.scheduledFor || ''}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createNotification}>
                  <Send className="h-4 w-4 mr-2" />
                  {newNotification.scheduledFor ? 'Schedule' : 'Send'} Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => !n.readBy?.length).length}
                </div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.status === 'scheduled').length}
                </div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1">
          {(['all', 'unread', 'sent', 'scheduled'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className="capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {selectedFilter === 'all' 
                  ? 'No notifications have been created yet'
                  : `No ${selectedFilter} notifications found`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const isUnread = !notification.readBy?.length;
            
            return (
              <Card key={notification.id} className={isUnread ? 'border-primary/20 bg-primary/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          {notification.status === 'scheduled' && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                          {isUnread && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString()} {' '}
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="capitalize">
                            {notification.recipientType} recipient{notification.recipientType !== 'user' ? 's' : ''}
                          </span>
                          {notification.scheduledFor && (
                            <span>
                              Scheduled for: {new Date(notification.scheduledFor).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            {notification.actions.map((action) => (
                              <Button 
                                key={action.action}
                                variant={action.variant || 'outline'}
                                size="sm"
                                onClick={() => handleNotificationAction(notification.id, action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}