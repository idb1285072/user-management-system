import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { UserTypeEnum } from './enums/user-type.enum';

export interface ChildUserFormInterface {
  column: FormControl<string>;
  value: FormControl<string>;
}

export interface UserFormInterface {
  id: FormControl<number>;
  name: FormControl<string>;
  age: FormControl<number>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
  registeredDate: FormControl<string>;
  role: FormControl<UserTypeEnum>;
  isActive: FormControl<boolean>;
  children: FormArray<FormGroup<ChildUserFormInterface>>;
}

export interface UsersFormInterface {
  users: FormArray<FormGroup<UserFormInterface>>;
}
