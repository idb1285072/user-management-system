import { Injectable } from '@angular/core';

import { users } from './data/user-data';
import { UserInterface } from './types/user.interface';
import { UserTypeEnum } from './types/enums/user-type.enum';
import { StatusTypeEnum } from './types/enums/status-type.enum';

@Injectable({ providedIn: 'root' })
export class UserService {
  private users: UserInterface[] = [];

  constructor() {
    const savedData = window.localStorage.getItem('saved-users-data');
    this.users = savedData ? JSON.parse(savedData) : [...users];
    this.saveToLocalStorage();
  }

  getAllEmails(): string[] {
    return this.users.map((user: UserInterface) =>
      user.email.toLowerCase().trim()
    );
  }

  getPaginatedUsers(
    page: number,
    itemsPerPage: number,
    status: StatusTypeEnum = StatusTypeEnum.all,
    searchText: string = '',
    roleFilter: UserTypeEnum = UserTypeEnum.All
  ): { users: UserInterface[]; totalUsers: number } {
    const normalize = (val: string) => val.toLowerCase();
    const normalizeSerchText = normalize(searchText.trim());

    const filteredUsers = this.users
      .filter((u) =>
        status === StatusTypeEnum.all
          ? true
          : status === StatusTypeEnum.active
          ? u.isActive
          : !u.isActive
      )
      .filter((u) =>
        !normalizeSerchText
          ? true
          : [u.name, u.email, u.address].some((field) =>
              normalize(field).includes(normalizeSerchText)
            )
      )
      .filter((u) => roleFilter === UserTypeEnum.All || u.role === roleFilter);

    const totalUsers = filteredUsers.length;
    const start = (page - 1) * itemsPerPage;
    const paginated = filteredUsers.slice(start, start + itemsPerPage);
    return { users: paginated, totalUsers };
  }

  addUser(user: UserInterface) {
    user.id =
      this.users.length > 0 ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    this.users.push(user);
    this.saveToLocalStorage();
  }

  getUserById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  updateUser(partialUser: Partial<UserInterface> & { id: number }) {
    const index = this.users.findIndex((u) => u.id === partialUser.id);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...partialUser,
      };
      this.saveToLocalStorage();
    }
  }

  toggleStatus(id: number) {
    const user = this.getUserById(id);
    if (user) {
      user.isActive = !user.isActive;
      this.saveToLocalStorage();
    }
  }

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
    this.saveToLocalStorage();
  }

  private saveToLocalStorage() {
    window.localStorage.setItem('saved-users-data', JSON.stringify(this.users));
  }
}
