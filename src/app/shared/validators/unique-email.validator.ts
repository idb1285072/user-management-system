import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { UserFormInterface } from 'src/app/user/types/user-form.interface';
import { UserService } from 'src/app/user/user.service';

export function uniqueEmailValidator(
  userService: UserService,
  originalEmail: string = '',
  parentFormArray?: FormArray<FormGroup<UserFormInterface>>,
  currentControl?: AbstractControl
) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim().toLowerCase();
    if (!value) return null;

    let existsInFormArray = false;

    if (parentFormArray && currentControl) {
      existsInFormArray = parentFormArray.controls.some((ctrl) => {
        if (ctrl.get('email') === currentControl) return false;
        const email = (ctrl.get('email')?.value ?? '').trim().toLowerCase();
        return email === value;
      });
    }

    if (existsInFormArray) return { notUniqueEmail: true };

    const dbEmails = userService
      .getAllEmails()
      .map((e) => e.trim().toLowerCase());
    const existsInDb =
      dbEmails.includes(value) &&
      (!parentFormArray ||
        !parentFormArray.controls.some(
          (ctrl) =>
            (ctrl.get('email')?.value ?? '').trim().toLowerCase() === value
        )) &&
      value !== originalEmail.toLowerCase();

    return existsInDb ? { notUniqueEmail: true } : null;
  };
}
