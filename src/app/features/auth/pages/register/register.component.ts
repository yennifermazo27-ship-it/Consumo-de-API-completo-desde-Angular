import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  standalone: false
})
export class RegisterComponent {
  private fb = inject(FormBuilder);

  loading = false;
  errorMessage = '';

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private authService: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { name, email, password } = this.form.getRawValue();

    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/tickets']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error?.message || 'No se pudo completar el registro.';
      }
    });
  }
}