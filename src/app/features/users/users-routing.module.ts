import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './pages/user-list/user-list.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '', component: UserListComponent, canActivate: [roleGuard], data: { roles: ['admin'] } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }