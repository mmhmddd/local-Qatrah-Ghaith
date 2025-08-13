import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  FormsModule, 
  ReactiveFormsModule, 
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { JoinRequestService } from '../../core/services/join-request.service';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, timer } from 'rxjs';

// Custom Validators
export class CustomValidators {
  static fullName(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null; // Let Validators.required handle empty input
    const namePattern = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!namePattern.test(value)) {
      return { pattern: true };
    }
    if (value.replace(/\s/g, '').length === 0) {
      return { onlySpaces: true };
    }
    return null;
  }

  static enhancedEmail(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(control.value) ? null : { email: true };
  }
}

interface JoinFormData {
  name: string;
  email: string;
  number: string;
  academicSpecialization: string;
  address: string;
}

interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  status: number;
}

@Component({
  selector: 'app-join-us',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './join-us.component.html',
  styleUrl: './join-us.component.scss'
})
export class JoinUsComponent implements OnInit, OnDestroy {
  joinForm!: FormGroup;
  submitted = false;
  isPending = false;
  isSubmitting = false;
  emailExistsError = false;
  generalError: string | null = null;
  
  private destroy$ = new Subject<void>();
  private existingEmails: Set<string> = new Set();

  constructor(
    private fb: FormBuilder, 
    private joinRequestService: JoinRequestService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadExistingEmails();
    this.setupFormChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.joinForm = this.fb.group({
      name: [
        '', 
        [
          Validators.required, 
          Validators.minLength(2),
          Validators.maxLength(100),
          CustomValidators.fullName
        ]
      ],
      email: [
        '', 
        [
          Validators.required, 
          CustomValidators.enhancedEmail
        ]
      ],
      number: [
        '', 
        [
          Validators.required
        ]
      ],
      academicSpecialization: [
        '', 
        [
          Validators.required, 
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],
      address: [
        '', 
        [
          Validators.required, 
          Validators.minLength(5),
          Validators.maxLength(500)
        ]
      ]
    });
  }

  private setupFormChangeListeners(): void {
    this.joinForm.get('email')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.emailExistsError) {
          this.emailExistsError = false;
          const emailControl = this.joinForm.get('email');
          if (emailControl && emailControl.errors) {
            delete emailControl.errors['emailExists'];
            if (Object.keys(emailControl.errors).length === 0) {
              emailControl.setErrors(null);
            }
          }
        }
      });

    this.joinForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.generalError) {
          this.generalError = null;
        }
      });
  }

  private loadExistingEmails(): void {
    this.existingEmails.add('test@example.com');
    this.existingEmails.add('admin@example.com');
    this.existingEmails.add('user@domain.com');
  }

  private isEmailExists(email: string): boolean {
    return this.existingEmails.has(email.toLowerCase());
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.joinForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.joinForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.joinForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return 'هذا الحقل مطلوب';
    if (errors['minlength']) return `الحد الأدنى ${errors['minlength'].requiredLength} أحرف`;
    if (errors['maxlength']) return `الحد الأقصى ${errors['maxlength'].requiredLength} حرف`;
    if (errors['email']) return 'البريد الإلكتروني غير صالح';
    if (errors['pattern'] && fieldName === 'name') {
      return 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط';
    }
    if (errors['onlySpaces'] && fieldName === 'name') {
      return 'الاسم لا يمكن أن يكون فراغات فقط';
    }
    if (errors['emailExists']) return 'البريد الإلكتروني مستخدم بالفعل';
    return 'تنسيق غير صالح';
  }

  private validateForm(): boolean {
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });

    if (!this.joinForm.valid) {
      this.generalError = 'يرجى تصحيح الأخطاء في النموذج';
      this.scrollToTop();
      return false;
    }

    const email = this.joinForm.get('email')?.value;
    if (email && this.isEmailExists(email)) {
      this.emailExistsError = true;
      this.joinForm.get('email')?.setErrors({ emailExists: true });
      this.scrollToTop();
      return false;
    }

    return true;
  }

  onSubmit(): void {
    this.resetErrors();

    if (!this.validateForm()) {
      this.isSubmitting = false; // Stop loader immediately
      return;
    }

    this.isSubmitting = true;

    const formData: JoinFormData = this.joinForm.value;

    this.joinRequestService.create(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          this.handleSuccessResponse(response, formData.email);
        },
        error: (error: ApiError) => {
          this.handleErrorResponse(error);
          this.isSubmitting = false; // Stop loader on error
          this.scrollToTop();
        },
        complete: () => {
          this.isSubmitting = false; // Ensure loader stops
        }
      });
  }

  private scrollToTop(): void {
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private handleSuccessResponse(response: JoinRequestResponse, email: string): void {
    console.log('Join request submitted successfully:', response);
    
    this.existingEmails.add(email.toLowerCase());
    
    this.joinForm.reset();
    
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
    
    this.submitted = true;
    this.isPending = true;
    
    this.simulateApprovalProcess();
  }

  private handleErrorResponse(error: ApiError): void {
    console.error('Error submitting join request:', error);
    
    if (error.status === 409 || 
        (error.error?.code === 'EMAIL_EXISTS') ||
        (error.error?.message?.toLowerCase().includes('email') && 
         error.error?.message?.toLowerCase().includes('exists'))) {
      this.emailExistsError = true;
      this.joinForm.get('email')?.setErrors({ emailExists: true });
    } else if (error.status === 400) {
      this.generalError = 'البيانات المدخلة غير صالحة. يرجى المراجعة والمحاولة مرة أخرى.';
    } else if (error.status === 500) {
      this.generalError = 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    } else if (error.status === 0) {
      this.generalError = 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
    } else {
      this.generalError = error.error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    }
  }

  private simulateApprovalProcess(): void {
    timer(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isPending = false;
    });
  }

  private resetErrors(): void {
    this.emailExistsError = false;
    this.generalError = null;
  }

  dismissEmailError(): void {
    this.emailExistsError = false;
    const emailControl = this.joinForm.get('email');
    if (emailControl && emailControl.errors) {
      delete emailControl.errors['emailExists'];
      if (Object.keys(emailControl.errors).length === 0) {
        emailControl.setErrors(null);
      }
    }
  }

  dismissGeneralError(): void {
    this.generalError = null;
  }

  resetForm(): void {
    this.joinForm.reset();
    this.resetErrors();
    this.submitted = false;
    this.isPending = false;
    this.isSubmitting = false;
    
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
  }

  getFormControl(name: string): AbstractControl | null {
    return this.joinForm.get(name);
  }

  get hasFormErrors(): boolean {
    return this.joinForm.invalid && (this.joinForm.dirty || this.joinForm.touched);
  }

  get formValidationSummary(): string[] {
    const errors: string[] = [];
    
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control && control.invalid && control.touched) {
        const fieldError = this.getFieldError(key);
        if (fieldError) {
          const fieldLabels: { [key: string]: string } = {
            'name': 'الاسم',
            'email': 'البريد الإلكتروني',
            'number': 'رقم الهاتف',
            'academicSpecialization': 'التخصص الجامعي',
            'address': 'العنوان'
          };
          errors.push(`${fieldLabels[key]}: ${fieldError}`);
        }
      }
    });
    
    return errors;
  }
}