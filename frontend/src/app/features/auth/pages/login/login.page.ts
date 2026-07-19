import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  metodoAcceso = signal<'password' | 'pin'>('password');
  cargando = signal(false);
  error = signal<string | null>(null);

  // Formulario tradicional
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // PIN de 4 dÃ­gitos
  pin = signal<string>('');

  cambiarMetodo(metodo: 'password' | 'pin') {
    this.metodoAcceso.set(metodo);
    this.error.set(null);
    this.pin.set('');
    this.form.reset();
  }

  // LÃ³gica del teclado numÃ©rico
  pulsarNumero(num: number) {
    if (this.pin().length < 6 && !this.cargando()) {
      const nuevoPin = this.pin() + num;
      this.pin.set(nuevoPin);
      if (nuevoPin.length === 6) {
        this.submitPin();
      }
    }
  }

  borrarDigito() {
    if (this.pin().length > 0 && !this.cargando()) {
      this.pin.update(p => p.slice(0, -1));
    }
  }

  submitPassword(): void {
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.error.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.router.navigate([res.usuario.rol === 'ADMIN' ? '/admin' : '/pos']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.message || 'Email o contraseÃ±a incorrectos');
      },
    });
  }

  private submitPin(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.authService.loginConPin({ pin: this.pin() }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.router.navigate([res.usuario.rol === 'ADMIN' ? '/admin' : '/pos']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.pin.set(''); // Limpia el PIN incorrecto
        this.error.set(err.error?.message || 'PIN de acceso invÃ¡lido');
      },
    });
  }
}

