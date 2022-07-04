import {Entity, model, property, belongsTo, hasOne} from '@loopback/repository';
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
    in: [Status.TODO, Status.IN_PROGRESS, Status.COMPLETE],
  })
  status?: string;

  @property({
    type: 'date',
  })
  completedAt?: string;

  @belongsTo(() => Project)
  projectId: string;

  @belongsTo(() => User)
  userId: string;

  @hasOne(() => Todo)
  linkedTodo: Todo;

  @property({
    type: 'string',
  })
  todoId?: string;

  constructor(data?: Partial<Todo>) {
    super(data);
  }
}

export interface TodoRelations {
  // describe navigational properties here
}

export type TodoWithRelations = Todo & TodoRelations;
