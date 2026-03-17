import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, User } from 'lucide-react'
import { format } from 'date-fns/format'
import { Project } from '../hooks/useProjectsPage'

interface ProjectCardProps {
  project: Project
}

export const ProjectCard = memo(({ project }: ProjectCardProps) => {
  return (
    <Link key={project.id} to={`/projetos/${project.id}`}>
      <Card className="bg-black border border-white/20 rounded-none hover:border-white transition-all duration-300 group h-full">
        <CardHeader className="pb-4 border-b border-white/10 group-hover:border-white/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-serif text-white uppercase tracking-wide group-hover:text-white transition-colors">
                {project.name}
              </CardTitle>
              {project.event_type && (
                <div className="inline-block border border-white/20 px-2 py-0.5 text-[9px] font-mono text-white/60 uppercase tracking-widest">
                  {project.event_type}
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className={`rounded-none border font-mono text-[9px] uppercase tracking-widest ${
                project.status === 'active'
                  ? 'border-white text-white'
                  : project.status === 'completed'
                    ? 'border-white/40 text-white/40'
                    : 'border-white/20 text-white/20'
              }`}
            >
              {project.status === 'active'
                ? 'ACTIVE'
                : project.status === 'completed'
                  ? 'DONE'
                  : 'VOID'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3 text-xs text-white/60 font-mono uppercase tracking-wide">
            {project.client && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/40" />
                <span className="text-white/80">
                  {project.client.full_name}
                </span>
              </div>
            )}
            {project.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white/40" />
                <span>
                  {format(new Date(project.event_date), 'dd.MM.yyyy')}
                </span>
              </div>
            )}
            {project.event_location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white/40" />
                <span>{project.event_location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

ProjectCard.displayName = 'ProjectCard'
