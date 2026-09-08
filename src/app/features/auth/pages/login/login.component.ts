import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  loading = false;
  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(private authService: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error?.message || 'Credenciales inválidas. Intenta de nuevo.';
      }
    });
  }

  private redirectAfterLogin(): void {
    // Todos los roles caen primero en la vista principal (tickets).
    // El admin puede ir a "Usuarios" desde ahí cuando quiera, con el botón
    // de esa sección — no de entrada al iniciar sesión.
    this.router.navigate(['/tickets']);
  }
}