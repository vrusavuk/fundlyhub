import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  StickyNote,
  Flag,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface UserNote {
  id: string;
  user_id: string;
  admin_id: string;
  note_type: 'general' | 'warning' | 'flag' | 'positive' | 'investigation';
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  admin_profile?: {
    name: string;
    email: string;
  };
}

interface UserNotesSystemProps {
  userId: string;
  userName: string;
}

export function UserNotesSystem({ userId, userName }: UserNotesSystemProps) {
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    note_type: 'general' as const,
    is_internal: true
  });
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  useEffect(() => {
    fetchUserNotes();
  }, [userId]);

  const fetchUserNotes = async () => {
    try {
      setLoading(true);
      
      // Fetch user notes directly from the table
      const { data, error } = await supabase
        .from('user_admin_notes')
        .select(`
          *,
          admin_profile:profiles!admin_id(name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const notesData = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        admin_id: row.admin_id,
        note_type: row.note_type,
        content: row.content,
        is_internal: row.is_internal,
        created_at: row.created_at,
        updated_at: row.updated_at,
        admin_profile: {
          name: row.admin_name,
          email: row.admin_email
        }
      }));

      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching user notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_admin_notes')
        .insert({
          user_id: userId,
          admin_id: user.user?.id,
          note_type: newNote.note_type,
          content: newNote.content,
          is_internal: newNote.is_internal
        });

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: user.user?.id,
        _action: 'user_note_added',
        _resource_type: 'user',
        _resource_id: userId,
        _metadata: { 
          note_type: newNote.note_type,
          content: newNote.content.substring(0, 100)
        }
      });

      toast({
        title: 'Note Added',
        description: 'User note has been saved successfully'
      });

      setNewNote({ content: '', note_type: 'general', is_internal: true });
      setShowAddDialog(false);
      fetchUserNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive'
      });
    }
  };

  const updateNote = async () => {
    if (!editingNote || !editingNote.content.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_admin_notes')
        .update({
          content: editingNote.content,
          note_type: editingNote.note_type,
          is_internal: editingNote.is_internal,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: user.user?.id,
        _action: 'user_note_updated',
        _resource_type: 'user',
        _resource_id: userId,
        _metadata: { note_id: editingNote.id }
      });

      toast({
        title: 'Note Updated',
        description: 'User note has been updated successfully'
      });

      setEditingNote(null);
      fetchUserNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive'
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_admin_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: user.user?.id,
        _action: 'user_note_deleted',
        _resource_type: 'user',
        _resource_id: userId,
        _metadata: { note_id: noteId }
      });

      toast({
        title: 'Note Deleted',
        description: 'User note has been removed'
      });

      fetchUserNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'flag':
        return <Flag className="h-4 w-4 text-red-600" />;
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'investigation':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNoteBadge = (noteType: string) => {
    const badgeMap = {
      general: { variant: 'outline' as const, label: 'General' },
      warning: { variant: 'destructive' as const, label: 'Warning' },
      flag: { variant: 'destructive' as const, label: 'Flagged' },
      positive: { variant: 'default' as const, label: 'Positive' },
      investigation: { variant: 'secondary' as const, label: 'Investigation' }
    };

    const badge = badgeMap[noteType as keyof typeof badgeMap] || 
                  { variant: 'outline' as const, label: 'General' };

    return (
      <Badge variant={badge.variant} className="text-xs">
        {badge.label}
      </Badge>
    );
  };

  if (!hasPermission('manage_user_notes')) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <StickyNote className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p className="text-muted-foreground">You don't have permission to view user notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <StickyNote className="mr-2 h-4 w-4" />
              Admin Notes
            </CardTitle>
            <CardDescription>
              Internal notes and flags for {userName}
            </CardDescription>
          </div>
          {hasPermission('add_user_notes') && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Admin Note</DialogTitle>
                  <DialogDescription>
                    Add an internal note about this user for other administrators
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Note Type</label>
                    <Select
                      value={newNote.note_type}
                      onValueChange={(value: any) => setNewNote(prev => ({ ...prev, note_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Note</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="flag">Flag for Review</SelectItem>
                        <SelectItem value="positive">Positive Note</SelectItem>
                        <SelectItem value="investigation">Under Investigation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Note Content</label>
                    <Textarea
                      placeholder="Enter your note here..."
                      value={newNote.content}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addNote} disabled={!newNote.content.trim()}>
                      Add Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No admin notes found</p>
            <p className="text-sm">Add notes to track important information about this user</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getNoteIcon(note.note_type)}
                    {getNoteBadge(note.note_type)}
                    {!note.is_internal && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasPermission('edit_user_notes') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission('delete_user_notes') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm mb-3">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3" />
                    <span>
                      {note.admin_profile?.name || 'Unknown Admin'} • {note.admin_profile?.email}
                    </span>
                  </div>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Admin Note</DialogTitle>
              <DialogDescription>
                Update the note content and settings
              </DialogDescription>
            </DialogHeader>
            {editingNote && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Note Type</label>
                  <Select
                    value={editingNote.note_type}
                    onValueChange={(value: any) => setEditingNote(prev => prev ? { ...prev, note_type: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Note</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="flag">Flag for Review</SelectItem>
                      <SelectItem value="positive">Positive Note</SelectItem>
                      <SelectItem value="investigation">Under Investigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Note Content</label>
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingNote(null)}>
                    Cancel
                  </Button>
                  <Button onClick={updateNote} disabled={!editingNote.content.trim()}>
                    Update Note
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}