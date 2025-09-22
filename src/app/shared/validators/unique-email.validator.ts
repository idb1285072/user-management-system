import { AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from 'src/app/user/user.service';

export function uniqueEmailValidator(
  userService: UserService,
  currentEmail?: string // pass existing email to ignore in edit
) {
  return (control: AbstractControl): ValidationErrors | null => {
    const emails = userService.getAllEmails(); // string[]
    const value =
      typeof control.value === 'string'
        ? control.value.trim().toLowerCase()
        : '';

    const exists = emails.some(
      (e) =>
        e.trim().toLowerCase() === value &&
        e.trim().toLowerCase() !== (currentEmail?.trim().toLowerCase() || '')
    );

    return exists ? { notUniqueEmail: true } : null;
  };
}
