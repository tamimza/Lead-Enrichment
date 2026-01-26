'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Building2, Calendar, Check, MoreHorizontal, Trash2, Settings,
  Loader2, Sparkles, FileText, Pencil
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Project } from '@/types/project';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/project');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (project: Project) => {
    try {
      const response = await fetch(`/api/admin/project/${project.id}?action=activate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(`${project.companyName} is now active`);
        fetchProjects();
        router.refresh();
      } else {
        toast.error('Failed to activate project');
      }
    } catch {
      toast.error('Failed to activate project');
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/project/${deleteProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project deleted');
        setDeleteProject(null);
        fetchProjects();
      } else {
        toast.error('Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const getSetupMethodBadge = (method: string) => {
    switch (method) {
      case 'ai_assisted':
        return <Badge variant="default" className="gap-1"><Sparkles className="w-3 h-3" />AI-Assisted</Badge>;
      case 'template':
        return <Badge variant="secondary" className="gap-1"><FileText className="w-3 h-3" />Template</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Pencil className="w-3 h-3" />Manual</Badge>;
    }
  };

  const getStatusBadge = (project: Project) => {
    if (project.aiGenerationStatus === 'generating') {
      return <Badge variant="warning" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Generating...</Badge>;
    }
    if (project.aiGenerationStatus === 'failed') {
      return <Badge variant="destructive">Setup Failed</Badge>;
    }
    if (project.isActive) {
      return <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />Active</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Each project has its own business context and AI settings
          </p>
        </div>
        <Link href="/admin/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start enriching leads
            </p>
            <Link href="/admin/projects/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={project.isActive ? 'border-primary ring-1 ring-primary' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {project.companyName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {project.name}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!project.isActive && (
                        <DropdownMenuItem onClick={() => handleActivate(project)}>
                          <Check className="w-4 h-4 mr-2" />
                          Set as Active
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/settings/project?id=${project.id}`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteProject(project)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(project)}
                  {getSetupMethodBadge(project.setupMethod)}
                </div>
              </CardHeader>
              <CardContent>
                {project.companyDescription ? (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.companyDescription}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    No description added
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    {project.leadsUsedThisMonth}/{project.maxLeadsPerMonth} leads
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProject?.companyName}&quot;? This will also delete all
              associated configurations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
