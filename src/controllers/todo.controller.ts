import {authenticate} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  put,
  requestBody,
  RequestContext,
  response,
} from '@loopback/rest';
import {TodoServiceBindings} from '../keys';
import {Todo} from '../models';
import {TodoRepository} from '../repositories';
import {basicAuthorization} from '../services/basic.authorizor';
import {JWTService} from '../services/jwt.service';
import {MyTodoService} from '../services/todo-service';
import {Role} from '../shared/types';

export class TodoController {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,

    @inject.context()
    public context: RequestContext,

    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,

    @inject(TodoServiceBindings.TODO_SERVICE)
    public todoService: MyTodoService,
  ) {}

  @post('/todos')
  @response(201, {
    description: 'Todo model instance',
    content: {'application/json': {schema: getModelSchemaRef(Todo)}},
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.USER, Role.ADMIN],
    voters: [basicAuthorization],
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {
            title: 'NewTodo',
            exclude: ['id'],
          }),
        },
      },
    })
    todo: Omit<Todo, 'id'>,
  ): Promise<Todo> {
    return this.todoRepository.create(todo);
  }

  @get('/todos/{id}')
  @response(200, {
    description: 'Todo model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Todo, {includeRelations: true}),
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Todo, {exclude: 'where'}) filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    if (!this.context.request.headers.authorization) {
      throw new HttpErrors.Unauthorized('Token is required');
    }
    const token = this.context.request.headers.authorization.split(' ')[1];

    const isAuthorizedTodo = await this.todoService.isAllowToGetTodoById(
      token,
      id,
    );

    if (isAuthorizedTodo) {
      return this.todoRepository.findById(id, filter);
    } else {
      throw new HttpErrors.Forbidden('You are not allowed to get this todo');
    }
  }

  @get('/todos')
  @response(200, {
    description: 'Array of Todo model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Todo, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async find(@param.filter(Todo) filter?: Filter<Todo>): Promise<Todo[]> {
    try {
      const token = this.context.request.headers.authorization!.split(' ')[1];

      return await this.todoService.getTodoByUser(token, filter);
    } catch (error) {
      throw new HttpErrors.NotFound();
    }
  }

  @put('/todos/{id}')
  @response(204, {
    description: 'Todo PUT success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() todo: Todo,
  ): Promise<void> {
    await this.todoRepository.replaceById(id, todo);
  }

  @del('/todos/{id}')
  @response(204, {
    description: 'Todo DELETE success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.todoRepository.deleteById(id);
  }

  @post('/todos/{sourceId}/link/{targetId}')
  @response(204, {
    description: 'Link todo',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async linkTodo(
    @param.path.string('sourceId') sourceId: string,
    @param.path.string('targetId') targetId: string,
  ): Promise<void> {
    await this.todoService.linkTodo(sourceId, targetId);
  }

  @post('/todos/{sourceId}/unlink')
  @response(200, {
    description: 'Unlink todo',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async unlinkTodo(
    @param.path.string('sourceId') sourceId: string,
  ): Promise<void> {
    await this.todoService.unlinkTodo(sourceId);
  }
}
