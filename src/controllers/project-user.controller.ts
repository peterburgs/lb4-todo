import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {ProjectUser} from '../models';
import {ProjectUserRepository} from '../repositories';
import {basicAuthorization} from '../services/basic.authorizor';
import {Role} from '../shared/types';

export class ProjectUserController {
  constructor(
    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository,
  ) {}

  @post('/project-users')
  @response(200, {
    description: 'ProjectUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(ProjectUser)}},
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            title: 'NewProjectUser',
            exclude: ['id'],
          }),
        },
      },
    })
    projectUser: Omit<ProjectUser, 'id'>,
  ): Promise<ProjectUser> {
    return this.projectUserRepository.create(projectUser);
  }

  @get('/project-users')
  @response(200, {
    description: 'Array of ProjectUser model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ProjectUser, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(ProjectUser) filter?: Filter<ProjectUser>,
  ): Promise<ProjectUser[]> {
    return this.projectUserRepository.find(filter);
  }

  @get('/project-users/{id}')
  @response(200, {
    description: 'ProjectUser model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ProjectUser, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ProjectUser, {exclude: 'where'})
    filter?: FilterExcludingWhere<ProjectUser>,
  ): Promise<ProjectUser> {
    return this.projectUserRepository.findById(id, filter);
  }

  @put('/project-users/{id}')
  @response(204, {
    description: 'ProjectUser PUT success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() projectUser: ProjectUser,
  ): Promise<void> {
    await this.projectUserRepository.replaceById(id, projectUser);
  }

  @del('/project-users/{id}')
  @response(204, {
    description: 'ProjectUser DELETE success',
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ADMIN, Role.USER], voters: [basicAuthorization]})
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectUserRepository.deleteById(id);
  }
}
