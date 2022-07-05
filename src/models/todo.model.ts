import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Status} from '../shared/types';
import {Project} from './project.model';
import {User} from './user.model';

@model()
export class Todo extends Entity {
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
  title: string;

  @property({
    type: 'string',
    default: Status.TODO,
    jsonSchema: {
      enum: Object.values(Status),
    },
  })
  status?: Status;

  @property({
    type: 'date',
  })
  completedAt?: Date;

  @belongsTo(() => Project)
  projectId: string;

  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'string',
  })
  todoId?: string;

  constructor(data?: Partial<Todo>) {
    super(data);
  }
}

export interface TodoRelations {
  projectId?: Project;
  todoId?: Todo;
}

export type TodoWithRelations = Todo & TodoRelations;
