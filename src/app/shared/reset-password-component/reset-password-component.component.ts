import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../core/services/password-reset.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p class="subtitle">أدخل كلمة المرور الجديدة لإعادة تعيين حسابك</p>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="newPassword">كلمة المرور الجديدة</label>
            <input
              type="password"
              id="newPassword"
              [(ngModel)]="newPassword"
              name="newPassword"
              class="form-control"
              placeholder="أدخل كلمة المرور الجديدة"
              required
              minlength="6"
              [disabled]="isLoading"
            />
            <p *ngIf="newPassword && newPassword.length < 6" class="error">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
          </div>
          <div class="form-group">
            <label for="confirmPassword">تأكيد كلمة المرور</label>
            <input
              type="password"
              id="confirmPassword"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              class="form-control"
              placeholder="أعد إدخال كلمة المرور"
              required
              [disabled]="isLoading"
            />
            <p *ngIf="confirmPassword && newPassword !== confirmPassword" class="error">كلمة المرور غير متطابقة</p>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="isLoading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword"
          >
            <span *ngIf="!isLoading">إعادة تعيين كلمة المرور</span>
            <span *ngIf="isLoading" class="loading-spinner"></span>
          </button>
          <p *ngIf="message" class="message">{{ message }}</p>
          <p *ngIf="error" class="error">{{ error }}</p>
          <p class="back-link">
            <a routerLink="/login">العودة إلى تسجيل الدخول</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 450px;
      text-align: center;
      animation: fadeIn 0.5s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h2 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .subtitle {
      color: #666;
      font-size: 1rem;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
      text-align: right;
    }

    label {
      display: block;
      font-size: 1rem;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      font-size: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
    }

    .form-control:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #007bff;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.3s ease, transform 0.2s ease;
      position: relative;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .btn-primary:disabled {
      background: #b3d7ff;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #ffffff;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .message {
      color: #28a745;
      font-size: 1rem;
      margin-top: 15px;
      background: #e6f4ea;
      padding: 10px;
      border-radius: 5px;
    }

    .error {
      color: #dc3545;
      font-size: 1rem;
      margin-top: 15px;
      background: #f8d7da;
      padding: 10px;
      border-radius: 5px;
    }

    .back-link {
      margin-top: 20px;
      font-size: 0.9rem;
    }

    .back-link a {
      color: #007bff;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .back-link a:hover {
      color: #0056b3;
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .card {
        padding: 20px;
        max-width: 90%;
      }

      h2 {
        font-size: 1.5rem;
      }

      .form-control {
        font-size: 0.9rem;
        padding: 10px;
      }

      .btn-primary {
        font-size: 1rem;
        padding: 10px;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  newPassword: string = '';
  confirmPassword: string = '';
  token: string = '';
  message: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private passwordResetService: PasswordResetService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit() {
    this.message = '';
    this.error = '';
    this.isLoading = true;

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين';
      this.isLoading = false;
      return;
    }

    this.passwordResetService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.message = response.message;
        this.newPassword = '';
        this.confirmPassword = '';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور';
        this.isLoading = false;
      }
    });
  }
}
