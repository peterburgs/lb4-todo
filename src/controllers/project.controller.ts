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
import {Project} from '../models';
import {ProjectRepository} from '../repositories';
import {basicAuthorization} from '../services/basic.authorizor';
import {Role} from '../shared/types';

export class ProjectController {
  constructor(
    @repository(ProjectRepository)
    public projectRepository: ProjectRepository,
  ) {}

  @post('/projects')
  @response(200, {
    description: 'Project model instance',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
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
          schema: getModelSchemaRef(Project, {
            title: 'NewProject',
            exclude: ['id'],
          }),
        },
      },
    })
    project: Omit<Project, 'id'>,
  ): Promise<Project> {
    return this.projectRepository.create(project);
  }

  @get('/projects')
  @response(200, {
    description: 'Array of Project model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Project, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async find(
    @param.filter(Project) filter?: Filter<Project>,
  ): Promise<Project[]> {
    return this.projectRepository.find(filter);
  }

  @get('/projects/{id}')
  @response(200, {
    description: 'Project model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Project, {includeRelations: true}),
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
    @param.filter(Project, {exclude: 'where'})
    filter?: FilterExcludingWhere<Project>,
  ): Promise<Project> {
    return this.projectRepository.findById(id, filter);
  }

  @put('/projects/{id}')
  @response(204, {
    description: 'Project PUT success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() project: Project,
  ): Promise<void> {
    await this.projectRepository.replaceById(id, project);
  }

  @del('/projects/{id}')
  @response(204, {
    description: 'Project DELETE success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: [Role.ADMIN, Role.USER],
    voters: [basicAuthorization],
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectRepository.deleteById(id);
  }
}
