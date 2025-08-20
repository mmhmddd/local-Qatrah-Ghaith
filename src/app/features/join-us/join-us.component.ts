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
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, timer } from 'rxjs';

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

  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null; // Let Validators.required handle empty input
    const phonePattern = /^\d{9,12}$/;
    return phonePattern.test(value) ? null : { pattern: true };
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
  imports: [FormsModule, CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './join-us.component.html',
  styleUrls: ['./join-us.component.scss']
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
    private joinRequestService: JoinRequestService,
    public translationService: TranslationService
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
          Validators.required,
          CustomValidators.phoneNumber
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

  private validateForm(): boolean {
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });

    if (!this.joinForm.valid) {
      this.generalError = this.translationService.translate('joinUs.formInvalid');
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
      this.isSubmitting = false;
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
          this.isSubmitting = false;
          this.scrollToTop();
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }

  private scrollToTop(): void {
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
      this.generalError = this.translationService.translate('joinUs.invalidData');
    } else if (error.status === 500) {
      this.generalError = this.translationService.translate('joinUs.serverError');
    } else if (error.status === 0) {
      this.generalError = this.translationService.translate('joinUs.networkError');
    } else {
      this.generalError = this.translationService.translate('joinUs.unexpectedError');
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
}
