import { Role } from '@/pages/admin/RoleManagement';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Edit, Trash2, Shield } from 'lucide-react';

interface RoleMobileCardProps {
  role: Role;
  permissionCount: number;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
}

export function RoleMobileCard({ role, permissionCount, onEdit, onDelete }: RoleMobileCardProps) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{role.display_name}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{role.name}</p>
            {role.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {role.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(role)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!role.is_system_role && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(role.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {role.user_count || 0} users
          </Badge>
          <Badge variant="outline">
            {permissionCount} permissions
          </Badge>
          <Badge variant={role.hierarchy_level > 50 ? 'destructive' : 'default'}>
            Level {role.hierarchy_level}
          </Badge>
          {role.is_system_role && (
            <Badge variant="secondary">System</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
