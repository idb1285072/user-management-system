import { FormArray, FormGroup } from '@angular/forms';
import { UserFormInterface } from './user-form.interface';

export interface UsersFormInterface {
  users: FormArray<FormGroup<UserFormInterface>>;
}
