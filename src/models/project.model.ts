import {Entity, model, property, hasMany, belongsTo} from '@loopback/repository';
import {ProjectUser} from './project-user.model';
import {Todo} from './todo.model';
import {User} from './user.model';

@model()
export class Project extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;
  
  @hasMany(() => ProjectUser)
  projectUsers: ProjectUser[];

  @hasMany(() => Todo)
  todos: Todo[];

  @belongsTo(() => User)
  ownerId: string;

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {
  // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
