import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { User, UserRole } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
  standalone: false
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  roles: UserRole[] = ['admin', 'agent', 'client'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los usuarios.';
        this.loading = false;
      }
    });
  }

  changeRole(user: User, role: UserRole): void {
    this.userService.updateUserRole(user.id, role).subscribe({
      next: (updated) => (user.role = updated.role)
    });
  }
}