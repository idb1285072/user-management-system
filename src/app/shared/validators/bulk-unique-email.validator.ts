import {
  AbstractControl,
  ValidationErrors,
  FormArray,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { UserService } from 'src/app/user/user.service';

export function bulkUniqueEmailValidator(
  userService: UserService,
  currentEmails: string[]
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control.get('users') as FormArray;
    if (!formArray) return null;

    const pageEmails = new Set(currentEmails.map((e) => e.toLowerCase()));
    const allEmails = userService.getAllEmails().map((e) => e.toLowerCase());

    const storedEmails = allEmails.filter((e) => !pageEmails.has(e));

    const emailsInForm = formArray.controls.map(
      (group) => group.get('email')?.value?.toLowerCase() || ''
    );

    const duplicatesInForm = emailsInForm.filter(
      (email, i) => email && emailsInForm.indexOf(email) !== i
    );

    formArray.controls.forEach((group) => {
      const emailControl = group.get('email');
      if (!emailControl) return;

      const email = (emailControl.value || '').toLowerCase();
      const hasConflict =
        duplicatesInForm.includes(email) || storedEmails.includes(email);

      emailControl.setErrors(
        hasConflict
          ? { ...emailControl.errors, notUniqueEmail: true }
          : Object.keys(emailControl.errors || {}).filter(
              (k) => k !== 'notUniqueEmail'
            ).length
          ? emailControl.errors
          : null
      );
    });
    return null;
  };
}
