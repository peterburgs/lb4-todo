import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {Todo} from '../models';
import {TodoRepository, UserRepository} from '../repositories';
import {Role} from '../shared/types';
import {JWTService} from './jwt.service';

export class MyTodoService {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,

    @repository(UserRepository)
    public userRepository: UserRepository,

    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,
  ) {}

  async isAllowToGetTodoById(
    userToken: string,
    todoId: string,
  ): Promise<boolean> {
    const currentUser = await this.jwtService.verifyToken(userToken);

    if (currentUser.role === Role.ADMIN) {
      return true;
    }
    const todo = await this.todoRepository.findOne({
      where: {
        id: todoId,
      },
    });
    if (!todo) {
      return false;
    }
    if (todo.userId === currentUser.id) {
      return true;
    }
    return false;
  }

  async getTodoByUser(
    userToken: string,
    filter?: Filter<Todo>,
  ): Promise<Todo[]> {
    const currentUser = await this.jwtService.verifyToken(userToken);

    const todos = await this.todoRepository.find({
      ...filter,
      where: {
        userId: currentUser.id,
      },
    });
    if (!todos) {
      throw new HttpErrors.NotFound('Todo not found');
    }

    return todos;
  }

  async linkTodo(sourceId: string, toLinkId: string) {
    try {
      const isTodoLinkable = await this.isTodoLinkable(
        sourceId,
        toLinkId,
      );
      if (!isTodoLinkable) {
        throw new HttpErrors.BadRequest('Cannot link 2 todos');
      }
      await this.todoRepository.updateById(sourceId, {
        todoId: toLinkId,
      });
    } catch (error) {
      throw new HttpErrors.InternalServerError(error.message);
    }
  }

  async unlinkTodo(sourceId: string) {
    try {
      await this.todoRepository.updateById(sourceId, {
        todoId: '',
      });
    } catch (error) {
      throw new HttpErrors.InternalServerError('Cannot unlink todos');
    }
  }

  async isTodoLinkable(
    sourceTodoId: string,
    toLinkTodoId: string,
  ): Promise<boolean> {
    const todos = await this.todoRepository.find({
      where: {
        or: [
          {id: sourceTodoId},
          {
            id: toLinkTodoId,
          },
        ],
      },
    });
    const [sourceTodo, toLinkTodo] = todos;
    if (!sourceTodo || !toLinkTodo) {
      throw new HttpErrors.NotFound('Todo not found');
    }
    if (sourceTodo.projectId !== toLinkTodo.projectId) {
      throw new HttpErrors.UnprocessableEntity(
        'Cannot link todo of different projects',
      );
    }
    if (sourceTodo.todoId) {
      return false;
    }
    return true;
  }
}
