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
    return this.users.map((user: UserInterface) => user.email);
  }

  getPaginatedUsers(
    page: number,
    itemsPerPage: number,
    status: StatusTypeEnum = StatusTypeEnum.all,
    searchText: string = '',
    roleFilter: UserTypeEnum | 'all' = 'all'
  ): { users: UserInterface[]; totalUsers: number } {
    let filtered = [...this.users];

    if (status === StatusTypeEnum.active)
      filtered = filtered.filter((u) => u.isActive);
    else if (status === StatusTypeEnum.inactive)
      filtered = filtered.filter((u) => !u.isActive);

    if (searchText) {
      const lower = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          u.address.toLowerCase().includes(lower)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => {
        return u.role === roleFilter;
      });
    }

    console.log(filtered, typeof roleFilter, typeof UserTypeEnum.SuperAdmin);
    const totalUsers = filtered.length;
    const start = (page - 1) * itemsPerPage;
    const paginatedUsers = filtered.slice(start, start + itemsPerPage);

    return { users: paginatedUsers, totalUsers };
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

  updateUser(updatedUser: UserInterface) {
    const index = this.users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...updatedUser,
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
