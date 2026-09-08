import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TicketListComponent } from './pages/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { TicketFormComponent } from './pages/ticket-form/ticket-form.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '', component: TicketListComponent },
  {
    path: 'new',
    component: TicketFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['client', 'admin'] }
  },
  { path: ':id', component: TicketDetailComponent },
  {
    path: ':id/edit',
    component: TicketFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['agent', 'admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TicketsRoutingModule { }