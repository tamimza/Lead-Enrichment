'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Building2, Check, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '@/types/project';

export default function ProjectSelector() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Fetch all projects and active project in parallel
      const [projectsRes, activeRes] = await Promise.all([
        fetch('/api/admin/project'),
        fetch('/api/admin/project?active=true'),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveProject(data.project || null);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    if (project.id === activeProject?.id) return;

    try {
      const response = await fetch(`/api/admin/project/${project.id}?action=activate`, {
        method: 'POST',
      });

      if (response.ok) {
        setActiveProject(project);
        toast.success(`Switched to ${project.name}`);
        // Full page reload to ensure all components refresh with new project data
        window.location.reload();
      } else {
        toast.error('Failed to switch project');
      }
    } catch {
      toast.error('Failed to switch project');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/project/${deleteProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Deleted "${deleteProject.name}"`);
        setDeleteProject(null);

        // If we deleted the active project, reload to switch to another
        if (deleteProject.id === activeProject?.id) {
          window.location.reload();
        } else {
          // Just refresh the list
          await fetchProjects();
        }
      } else {
        toast.error('Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateProject = () => {
    router.push('/admin/projects/new');
  };

  const handleManageProjects = () => {
    router.push('/admin/projects');
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (!activeProject && projects.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateProject}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Project
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {activeProject?.name || 'Select Project'}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center group">
              <DropdownMenuItem
                onClick={() => handleSelectProject(project)}
                className="flex-1 flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">{project.companyName}</span>
                </div>
                {project.id === activeProject?.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteProject(project);
                }}
                className="p-2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateProject} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageProjects} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Manage Projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteProject?.name}</strong>?
              This will also delete all configurations, playbooks, priorities, rules,
              and email templates associated with this project.
              <br /><br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
