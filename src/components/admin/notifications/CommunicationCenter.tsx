import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Users, 
  User,
  Megaphone,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'email' | 'announcement' | 'direct_message' | 'broadcast';
  subject: string;
  content: string;
  sender: string;
  recipients: MessageRecipient[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
  openRate?: number;
  clickRate?: number;
  tags: string[];
}

interface MessageRecipient {
  id: string;
  email: string;
  name?: string;
  type: 'user' | 'admin' | 'all';
  deliveryStatus?: 'pending' | 'delivered' | 'failed' | 'bounced';
  openedAt?: string;
  clickedAt?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: Message['type'];
  category: string;
  variables: string[];
}

interface CreateMessageData {
  type: Message['type'];
  subject: string;
  content: string;
  recipients: MessageRecipient[];
  scheduledFor?: string;
  tags: string[];
}

export function CommunicationCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'messages' | 'templates' | 'analytics'>('messages');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all');
  const [newMessage, setNewMessage] = useState<CreateMessageData>({
    type: 'email',
    subject: '',
    content: '',
    recipients: [],
    tags: []
  });
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        type: 'announcement',
        subject: 'Platform Updates & New Features',
        content: 'We are excited to announce new features that will help you run more successful campaigns...',
        sender: 'admin@platform.com',
        recipients: [
          { id: '1', email: 'all@platform.com', type: 'all', deliveryStatus: 'delivered' }
        ],
        status: 'sent',
        createdAt: '2024-01-15T10:00:00Z',
        sentAt: '2024-01-15T10:30:00Z',
        openRate: 68.5,
        clickRate: 12.3,
        tags: ['announcement', 'features']
      },
      {
        id: '2',
        type: 'email',
        subject: 'Campaign Approval Notification',
        content: 'Your campaign "Help Local School" has been approved and is now live...',
        sender: 'admin@platform.com',
        recipients: [
          { id: '2', email: 'user@example.com', name: 'John Doe', type: 'user', deliveryStatus: 'delivered', openedAt: '2024-01-14T15:45:00Z' }
        ],
        status: 'sent',
        createdAt: '2024-01-14T14:00:00Z',
        sentAt: '2024-01-14T14:05:00Z',
        tags: ['approval', 'campaign']
      },
      {
        id: '3',
        type: 'broadcast',
        subject: 'Weekly Donation Summary',
        content: 'Here is your weekly summary of donations and campaign performance...',
        sender: 'system@platform.com',
        recipients: [
          { id: '3', email: 'campaigners@platform.com', type: 'user', deliveryStatus: 'pending' }
        ],
        status: 'scheduled',
        createdAt: '2024-01-15T12:00:00Z',
        scheduledFor: '2024-01-16T09:00:00Z',
        tags: ['weekly', 'summary']
      },
      {
        id: '4',
        type: 'direct_message',
        subject: 'Account Security Notice',
        content: 'We detected unusual activity on your account. Please review and secure your account...',
        sender: 'security@platform.com',
        recipients: [
          { id: '4', email: 'flagged@example.com', name: 'Jane Smith', type: 'user', deliveryStatus: 'failed' }
        ],
        status: 'failed',
        createdAt: '2024-01-15T08:00:00Z',
        tags: ['security', 'urgent']
      }
    ];

    const mockTemplates: MessageTemplate[] = [
      {
        id: '1',
        name: 'Campaign Approval',
        subject: 'Your Campaign "{campaignTitle}" Has Been Approved',
        content: 'Dear {userName},\n\nWe are pleased to inform you that your campaign "{campaignTitle}" has been approved and is now live on our platform...',
        type: 'email',
        category: 'approval',
        variables: ['userName', 'campaignTitle', 'campaignUrl']
      },
      {
        id: '2',
        name: 'Weekly Newsletter',
        subject: 'Weekly Platform Updates - {weekOf}',
        content: 'Hello {userName},\n\nHere are the latest updates from our platform for the week of {weekOf}...',
        type: 'announcement',
        category: 'newsletter',
        variables: ['userName', 'weekOf', 'topCampaigns', 'totalRaised']
      },
      {
        id: '3',
        name: 'Security Alert',
        subject: 'Important Security Notice for Your Account',
        content: 'Dear {userName},\n\nWe have detected {alertType} on your account. Please take immediate action...',
        type: 'direct_message',
        category: 'security',
        variables: ['userName', 'alertType', 'actionRequired', 'supportUrl']
      }
    ];

    setTimeout(() => {
      setMessages(mockMessages);
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchQuery === '' || 
        message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchQuery, statusFilter]);

  const getMessageStats = () => {
    const total = messages.length;
    const sent = messages.filter(m => m.status === 'sent').length;
    const scheduled = messages.filter(m => m.status === 'scheduled').length;
    const drafts = messages.filter(m => m.status === 'draft').length;
    const avgOpenRate = messages
      .filter(m => m.openRate)
      .reduce((sum, m) => sum + (m.openRate || 0), 0) / Math.max(messages.filter(m => m.openRate).length, 1);
    
    return { total, sent, scheduled, drafts, avgOpenRate };
  };

  const stats = getMessageStats();

  const createMessage = async () => {
    if (!newMessage.subject || !newMessage.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in subject and content',
        variant: 'destructive'
      });
      return;
    }

    if (newMessage.recipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one recipient',
        variant: 'destructive'
      });
      return;
    }

    try {
      const message: Message = {
        id: Date.now().toString(),
        ...newMessage,
        sender: 'admin@platform.com',
        status: newMessage.scheduledFor ? 'scheduled' : 'sent',
        createdAt: new Date().toISOString(),
        sentAt: newMessage.scheduledFor ? undefined : new Date().toISOString()
      };

      setMessages(prev => [message, ...prev]);
      setCreateDialogOpen(false);
      resetNewMessage();

      toast({
        title: 'Message Created',
        description: `Message ${newMessage.scheduledFor ? 'scheduled' : 'sent'} successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create message',
        variant: 'destructive'
      });
    }
  };

  const resetNewMessage = () => {
    setNewMessage({
      type: 'email',
      subject: '',
      content: '',
      recipients: [],
      tags: []
    });
    setSelectedTemplate('');
  };

  const useTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewMessage(prev => ({
        ...prev,
        type: template.type,
        subject: template.subject,
        content: template.content
      }));
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast({
      title: 'Message Deleted',
      description: 'Message has been removed successfully'
    });
  };

  const getStatusBadgeVariant = (status: Message['status']) => {
    switch (status) {
      case 'sent': return 'default';
      case 'scheduled': return 'secondary';
      case 'draft': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getDeliveryStatusColor = (status?: MessageRecipient['deliveryStatus']) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Communication Center</h2>
          <p className="text-muted-foreground">
            Manage messages, announcements, and communication templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Message</DialogTitle>
                <DialogDescription>
                  Send messages to users or schedule them for later delivery
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Template Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Use Template (Optional)</label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value);
                    if (value) useTemplate(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Type</label>
                    <Select 
                      value={newMessage.type} 
                      onValueChange={(value: Message['type']) => 
                        setNewMessage(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="direct_message">Direct Message</SelectItem>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Schedule For (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newMessage.scheduledFor || ''}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Message content"
                    rows={8}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Recipients</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="all-users"
                        checked={newMessage.recipients.some(r => r.type === 'all')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMessage(prev => ({
                              ...prev,
                              recipients: [{ id: 'all', email: 'all@platform.com', type: 'all' }]
                            }));
                          } else {
                            setNewMessage(prev => ({
                              ...prev,
                              recipients: prev.recipients.filter(r => r.type !== 'all')
                            }));
                          }
                        }}
                      />
                      <label htmlFor="all-users" className="text-sm font-medium">
                        All Users
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="admins-only"
                        checked={newMessage.recipients.some(r => r.type === 'admin')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMessage(prev => ({
                              ...prev,
                              recipients: [...prev.recipients.filter(r => r.type !== 'admin'), 
                                { id: 'admins', email: 'admins@platform.com', type: 'admin' as const }]
                            }));
                          } else {
                            setNewMessage(prev => ({
                              ...prev,
                              recipients: prev.recipients.filter(r => r.type !== 'admin')
                            }));
                          }
                        }}
                      />
                      <label htmlFor="admins-only" className="text-sm font-medium">
                        Admins Only
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={newMessage.tags.join(', ')}
                    onChange={(e) => setNewMessage(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="newsletter, announcement, important"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  {newMessage.scheduledFor ? 'Schedule' : 'Send'} Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.drafts}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg Open Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>  
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'No messages match your current filters'
                      : 'Create your first message to get started'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{message.subject}</h4>
                          <Badge variant={getStatusBadgeVariant(message.status)}>
                            {message.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {message.type.replace('_', ' ')}
                          </Badge>
                          {message.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {message.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Created: {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                          {message.sentAt && (
                            <span>
                              Sent: {new Date(message.sentAt).toLocaleDateString()}
                            </span>
                          )}
                          {message.scheduledFor && (
                            <span>
                              Scheduled for: {new Date(message.scheduledFor).toLocaleDateString()}
                            </span>
                          )}
                          <span>
                            Recipients: {message.recipients.length}
                          </span>
                          {message.openRate && (
                            <span>
                              Open Rate: {message.openRate}%
                            </span>
                          )}
                        </div>

                        {/* Recipients Status */}
                        {message.recipients.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {message.recipients.slice(0, 3).map((recipient, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span className="font-medium">
                                  {recipient.name || recipient.email}
                                </span>
                                <span className={getDeliveryStatusColor(recipient.deliveryStatus)}>
                                  {recipient.deliveryStatus || 'pending'}
                                </span>
                                {recipient.openedAt && (
                                  <span className="text-green-600">
                                    Opened {new Date(recipient.openedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {message.recipients.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{message.recipients.length - 3} more recipients
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {template.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>
                    Category: {template.category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Subject:</div>
                      <div className="text-sm">{template.subject}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Variables:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          useTemplate(template.id);
                          setCreateDialogOpen(true);
                        }}
                      >
                        Use Template
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {(stats.avgOpenRate || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Open Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {messages.filter(m => m.clickRate).reduce((sum, m) => sum + (m.clickRate || 0), 0) / Math.max(messages.filter(m => m.clickRate).length, 1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Click Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {messages.flatMap(m => m.recipients).filter(r => r.deliveryStatus === 'delivered').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {messages.flatMap(m => m.recipients).filter(r => r.deliveryStatus === 'failed' || r.deliveryStatus === 'bounced').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed/Bounced</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Performance</CardTitle>
              <CardDescription>
                Detailed analytics for your communication campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Detailed analytics charts and metrics would be displayed here in a production environment.
                  This would include open rates over time, click-through rates, delivery success rates, and audience engagement metrics.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}