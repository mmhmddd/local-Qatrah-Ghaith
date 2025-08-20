import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideInLeft', [
      state('void', style({ transform: 'translateX(-100%)', opacity: 0 })),
      state('*', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', animate('600ms ease-in-out'))
    ]),
    trigger('scaleIn', [
      state('void', style({ transform: 'scale(0)', opacity: 0 })),
      state('*', style({ transform: 'scale(1)', opacity: 1 })),
      transition('void => *', animate('500ms ease-in-out'))
    ]),
    trigger('fadeInUp', [
      state('void', style({ transform: 'translateY(20px)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('500ms ease-in-out'))
    ]),
    trigger('slideInRight', [
      state('void', style({ transform: 'translateX(100%)', opacity: 0 })),
      state('*', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', animate('600ms ease-in-out'))
    ])
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  loginError: string | null = null;
  loginSuccess: string | null = null;
  showPassword = false;
  rememberMe = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  getFieldClasses(field: string): string {
    const control = this.loginForm.get(field);
    return control?.touched || control?.dirty
      ? control.invalid ? 'form-control is-invalid' : 'form-control is-valid'
      : 'form-control';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && (control.touched || control.dirty) && control.invalid;
  }

  isFieldValid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && (control.touched || control.dirty) && control.valid;
  }

  getFieldErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return field === 'email' ? 'البريد الإلكتروني مطلوب' : 'كلمة المرور مطلوبة';
    if (control.errors['email']) return 'البريد الإلكتروني غير صحيح';
    if (control.errors['minlength']) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return 'خطأ غير معروف';
  }

  onFieldFocus(field: string): void {
    this.loginForm.get(field)?.markAsTouched();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onRememberMeChange(event: Event): void {
    this.rememberMe = (event.target as HTMLInputElement).checked;
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotojoinus(): void {
    this.router.navigate(['/join-us']);
  }

  demoLogin(role: string): void {
    this.isLoading = true;
    this.loginForm.disable(); 
    this.loginError = null;
    this.loginSuccess = null;

    const demoCredentials = {
      email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
      password: 'password123'
    };

    this.authService.login(demoCredentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loginForm.enable();
        this.loginSuccess = 'تم تسجيل الدخول بنجاح!';
        this.loginError = null;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.loginForm.enable();
        this.loginError = error.error?.message || 'فشل تسجيل الدخول';
        this.loginSuccess = null;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginForm.disable();
    this.loginError = null;
    this.loginSuccess = null;

    const credentials = {
      ...this.loginForm.value,
      rememberMe: this.rememberMe
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loginForm.enable();
        this.loginSuccess = 'تم تسجيل الدخول بنجاح!';
        this.loginError = null;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.loginForm.enable();
        this.loginError = error.error?.message || 'فشل تسجيل الدخول';
        this.loginSuccess = null;
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
