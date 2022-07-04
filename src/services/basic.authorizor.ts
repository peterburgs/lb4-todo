import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {securityId} from '@loopback/security';
import _ from 'lodash';
import {Role} from '../shared/types';
import {MyUserProfile} from '../types';

export async function basicAuthorization(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,
): Promise<AuthorizationDecision> {
  let currentUser: MyUserProfile;
  if (authorizationCtx.principals.length > 0) {
    const user = _.pick(authorizationCtx.principals[0], [
      'id',
      'email',
      'role',
    ]);
    currentUser = {
      [securityId]: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } else {
    return AuthorizationDecision.DENY;
  }
  if (!currentUser.role) {
    return AuthorizationDecision.DENY;
  }
  if (!metadata.allowedRoles) {
    return AuthorizationDecision.ALLOW;
  }

  let roleIsAllowed = false;
  if (metadata.allowedRoles!.includes(currentUser.role)) {
    roleIsAllowed = true;
    return AuthorizationDecision.ALLOW;
  }
  if (!roleIsAllowed) {
    return AuthorizationDecision.DENY;
  }
  if (currentUser.role === Role.ADMIN) {
    return AuthorizationDecision.ALLOW;
  }
  if (currentUser[securityId] === authorizationCtx.invocationContext.args[0]) {
    return AuthorizationDecision.ALLOW;
  }
  return AuthorizationDecision.DENY;
}
