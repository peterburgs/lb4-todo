import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {securityId} from '@loopback/security';
import {TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {MyUserProfile} from '../types';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  @inject(TokenServiceBindings.TOKEN_SECRET)
  public readonly jwtSecret: string;
  @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
  public readonly jwtExpiresIn: number;

  async verifyToken(token: string): Promise<MyUserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized('Token is required');
    }
    let userProfile: MyUserProfile;
    try {
      const decryptedToken = await verifyAsync(token, this.jwtSecret);
      userProfile = Object.assign(
        {id: '', email: '', role: '', [securityId]: ''},
        {
          [securityId]: decryptedToken.id,
          id: decryptedToken.id,
          email: decryptedToken.email,
          role: decryptedToken.role,
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized('Cannot verify token');
    }
    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error while generating token: userProfile not found',
      );
    }
    const userInfoForToken = {
      id: userProfile[securityId],
      email: userProfile.email,
      role: userProfile.role,
    };
    let token: string;
    try {
      token = await signAsync(userInfoForToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized('Cannot generate token');
    }
    return token;
  }
}
