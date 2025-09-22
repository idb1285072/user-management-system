import { FormControl } from '@angular/forms';
import { UserTypeEnum } from './enums/user-type.enum';

export interface UserInlineFormInterface {
  name: FormControl<string>;
  age: FormControl<number>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
  registeredDate: FormControl<string>;
  role: FormControl<UserTypeEnum>;
  isActive: FormControl<boolean>;
  // children?: FormArray<FormGroup<ChildUserBulkFormInterface>>;
}
