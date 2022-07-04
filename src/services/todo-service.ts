import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
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

  async authorizeTodo(userToken: string, todoId: string): Promise<boolean> {
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

  async linkTodo(sourceTodoId: string, toLinkTodoId: string) {
    try {
      const isTodoLinkable = await this.isTodoLinkable(
        sourceTodoId,
        toLinkTodoId,
      );
      if (!isTodoLinkable) {
        throw new HttpErrors.BadRequest('Cannot link 2 todos');
      }
      await this.todoRepository.updateById(sourceTodoId, {
        todoId: toLinkTodoId,
      });
    } catch (error) {
      throw new HttpErrors.InternalServerError(error.message);
    }
  }

  async unlinkTodo(sourceTodoId: string) {
    try {
      await this.todoRepository.updateById(sourceTodoId, {
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
    if (sourceTodo.linkedTodo) {
      return false;
    }
    return true;
  }
}
