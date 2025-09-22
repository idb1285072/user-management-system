import { FormControl } from '@angular/forms';

export interface ChildUserFormInterface {
  column: FormControl<string>;
  value: FormControl<string>;
}
