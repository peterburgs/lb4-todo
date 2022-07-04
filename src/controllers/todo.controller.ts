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
  @authorize({allowedRoles: ['user', 'admin'], voters: [basicAuthorization]})
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
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Todo, {exclude: 'where'}) filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    const token = this.context.request.headers.authorization!.split(' ')[1];

    const isAuthorizedTodo = await this.todoService.authorizeTodo(token, id);
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
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
  async find(@param.filter(Todo) filter?: Filter<Todo>): Promise<Todo[]> {
    try {
      const token = this.context.request.headers.authorization!.split(' ')[1];

      const todos = await this.todoRepository.find(filter);
      return todos.filter(async item =>
        this.todoService.authorizeTodo(token, item.id!),
      );
    } catch (error) {
      throw new HttpErrors.NotFound();
    }
  }

  @put('/todos/{id}')
  @response(204, {
    description: 'Todo PUT success',
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
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
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.todoRepository.deleteById(id);
  }

  @post('/todos/link/{id}')
  @response(204, {
    description: 'Link todo',
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
  async linkTodo(
    @param.path.string('id') sourceTodoId: string,
    @requestBody() toLinkTodoId: string,
  ): Promise<void> {
    await this.todoService.linkTodo(sourceTodoId, toLinkTodoId);
  }

  @post('/todos/unlink/{id}')
  @response(200, {
    description: 'Link todo',
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
  async unlinkTodo(
    @param.path.string('id') sourceTodoId: string,
  ): Promise<void> {
    await this.todoService.unlinkTodo(sourceTodoId);
  }
}
