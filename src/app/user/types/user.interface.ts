import { UserTypeEnum } from './enums/user-type.enum';

export interface UserInterface {
  id: number;
  name: string;
  age: number;
  email: string;
  phone: string;
  address: string;
  registeredDate: string;
  isActive: boolean;
  role: UserTypeEnum;
  children?: { column: string; value: string }[];
}
