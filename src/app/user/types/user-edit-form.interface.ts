import { FormControl } from '@angular/forms';
import { UserTypeEnum } from './enums/user-type.enum';

export type UserEditFormInterface = {
  id: FormControl<number>;
  name: FormControl<string>;
  age: FormControl<number>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
  registeredDate: FormControl<string>;
  isActive: FormControl<boolean>;
  role: FormControl<UserTypeEnum>;
};
