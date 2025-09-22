import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { UserEditComponent } from './user/user-edit/user-edit.component';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { PaginationComponent } from './shared/pagination/pagination.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RangePipe } from './shared/pipes/range.pipe';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserEditComponent,
    NavBarComponent,
    NotFoundComponent,
    PaginationComponent,
    RangePipe,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
