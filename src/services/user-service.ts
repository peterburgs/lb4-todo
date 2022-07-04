import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId} from '@loopback/security';
import {validate} from 'isemail';
import {PasswordHasherBindings} from '../keys';
import {User} from '../models';
import {Credentials, UserRepository} from '../repositories/user.repository';
import {MyUserProfile} from '../types';
import {BcryptHasher} from './hash.password.bcrypt';

export class MyUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,

    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
  ) {}
  async verifyCredentials(credentials: Credentials): Promise<User> {
    const {email, password} = credentials;
    const invalidCredentialsError = 'Invalid email or password.';

    if (!email) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    const foundUser = await this.userRepository.findOne({
      where: {email},
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    const passwordMatched = await this.hasher.comparePassword(
      password,
      foundUser.password,
    );
    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    return foundUser;
  }

  convertToUserProfile(user: User): MyUserProfile {
    return {
      [securityId]: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async validateCredentials(credentials: Credentials) {
    if (!validate(credentials.email)) {
      throw new HttpErrors.UnprocessableEntity('Invalid email');
    }

    if (credentials.password.length < 4) {
      throw new HttpErrors.UnprocessableEntity(
        'Password must be greater than 4 characters',
      );
    }
    // Find email in db

    const dbEmail = await this.userRepository.findOne({
      where: {
        email: credentials.email,
      },
    });

    if (dbEmail) {
      throw new HttpErrors.BadRequest('Email already existed');
    }
  }
}
