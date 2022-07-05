import {Entity, model, property, hasMany} from '@loopback/repository';
import {Role} from '../shared/types';
import {Todo} from './todo.model';
import {ProjectUser} from './project-user.model';
import {Project} from './project.model';

@model()
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    required: true,
    in: [Role.ADMIN, Role.USER],
  })
  role: string;

  @hasMany(() => Todo)
  todos: Todo[];

  @hasMany(() => ProjectUser)
  projectUsers: ProjectUser[];

  @hasMany(() => Project, {keyTo: 'ownerId'})
  ownedProjects: Project[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  projectUsers?: ProjectUser[];
  ownedProjects?: Project[];
}

export type UserWithRelations = User & UserRelations;
