import { FormControl } from '@angular/forms';
import { StatusTypeEnum } from './enums/status-type.enum';
import { UserTypeEnum } from './enums/user-type.enum';

export interface FilterFormInterface {
  status: FormControl<StatusTypeEnum>;
  role: FormControl<UserTypeEnum>;
  search: FormControl<string>;
}
