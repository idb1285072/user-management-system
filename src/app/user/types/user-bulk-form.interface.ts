import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { UserTypeEnum } from './enums/user-type.enum';

export interface UserBulkFormInterface {
  id: FormControl<number>;
  name: FormControl<string>;
  age: FormControl<number>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
  registeredDate: FormControl<string>;
  role: FormControl<UserTypeEnum>;
  isActive: FormControl<boolean>;
  children: FormArray<FormGroup<ChildUserBulkFormInterface>>;
}

export type ChildUserBulkFormInterface = {
  column: FormControl<string>;
  value: FormControl<string>;
};
