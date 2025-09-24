import { AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from 'src/app/user/user.service';

export function uniqueEmailValidator(
  userService: UserService,
  currentEmail?: string
) {
  return (control: AbstractControl): ValidationErrors | null => {
    const emails = userService.getAllEmails();
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
