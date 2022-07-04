import {securityId} from '@loopback/security';

export interface MyUserProfile {
  [securityId]: string;
  id: string;
  email?: string;
  role: string;
}
