import { Component, Inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('open', style({
        maxHeight: '300px',
        opacity: 1,
        paddingTop: '0',
        paddingBottom: '0'
      })),
      state('closed', style({
        maxHeight: '0px',
        opacity: 0,
        paddingTop: '0',
        paddingBottom: '0'
      })),
      transition('closed <=> open', [
        animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('iconRotate', [
      state('open', style({ transform: 'rotate(180deg)' })),
      state('closed', style({ transform: 'rotate(0deg)' })),
      transition('closed <=> open', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class ContactComponent implements AfterViewInit {
  @ViewChildren('faqAnswer') faqAnswers!: QueryList<ElementRef>;

  contactForm: FormGroup;
  submitted = false;
  activeFaq: number | null = null;
  isFormSubmitting = false;
  formSubmissionMessage = '';

  // FAQ data
  faqData = [
    {
      question: 'faq.joinPrograms',
      answer: 'faq.joinProgramsAnswer'
    },
    {
      question: 'faq.volunteeringOpportunities',
      answer: 'faq.volunteeringOpportunitiesAnswer'
    },
    {
      question: 'faq.supportInitiative',
      answer: 'faq.supportInitiativeAnswer'
    },
    {
      question: 'faq.workingHours',
      answer: 'faq.workingHoursAnswer'
    }
  ];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object,
    public translationService: TranslationService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+962|962|0)?(7[7-9]|6)\d{7}$/)]],
      service: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimations();
    }
  }

  private setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.contact-details, .whatsapp-section, .faq-section, .contact-form, .map-section');
    sections.forEach(section => observer.observe(section));
  }

  scrollToForm() {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById('contact-form');
      if (element) {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  toggleFaq(index: number) {
    if (this.activeFaq === index) {
      this.activeFaq = null;
    } else {
      this.activeFaq = index;
    }

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.updateFaqAnswerClasses();
      }, 50);
    }
  }

  private updateFaqAnswerClasses() {
    if (this.faqAnswers) {
      this.faqAnswers.forEach((answerEl, index) => {
        const element = answerEl.nativeElement;
        if (this.activeFaq === index) {
          element.classList.add('open');
        } else {
          element.classList.remove('open');
        }
      });
    }
  }

  getFaqState(index: number): string {
    return this.activeFaq === index ? 'open' : 'closed';
  }

  getIconState(index: number): string {
    return this.activeFaq === index ? 'open' : 'closed';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return this.translationService.translate(`home.${fieldName}Required`);
      }
      if (field.errors['email']) {
        return this.translationService.translate('home.emailInvalid');
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return this.translationService.translate('home.phonePattern');
        }
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return this.translationService.translate(`home.${fieldName}MinLength`).replace('${requiredLength}', requiredLength);
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return this.translationService.translate(`home.${fieldName}MaxLength`).replace('${maxLength}', maxLength);
      }
    }
    return '';
  }

  async onSubmit() {
    this.submitted = true;
    this.isFormSubmitting = true;
    this.formSubmissionMessage = '';

    if (this.contactForm.valid) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const formValue = this.contactForm.value;

        const whatsappMessage = this.createWhatsAppMessage(formValue);

        if (isPlatformBrowser(this.platformId)) {
          const whatsappUrl = `https://wa.me/+962795686452?text=${encodeURIComponent(whatsappMessage)}`;
          window.open(whatsappUrl, '_blank');
        }

        this.formSubmissionMessage = this.translationService.translate('home.successMessage');

        setTimeout(() => {
          this.contactForm.reset();
          this.submitted = false;
          this.formSubmissionMessage = '';
        }, 3000);

        console.log('Form Submitted:', formValue);

      } catch (error) {
        console.error('Form submission error:', error);
        this.formSubmissionMessage = this.translationService.translate('home.errorMessage');
      }
    } else {
      this.formSubmissionMessage = this.translationService.translate('home.formInvalid');
      this.scrollToFirstError();
    }

    this.isFormSubmitting = false;
  }

  private createWhatsAppMessage(formValue: any): string {
    const serviceNames: { [key: string]: string } = {
      'educational-programs': this.translationService.translate('home.educationalPrograms'),
      'volunteering': this.translationService.translate('home.volunteering'),
      'support': this.translationService.translate('home.support'),
      'partnership': this.translationService.translate('home.partnership'),
      'donation': this.translationService.translate('home.donation'),
      'other': this.translationService.translate('home.other')
    };

    return this.translationService.translate('home.whatsappMessage')
      .replace('${name}', formValue.name)
      .replace('${email}', formValue.email)
      .replace('${phone}', formValue.phone)
      .replace('${service}', serviceNames[formValue.service] || formValue.service)
      .replace('${message}', formValue.message);
  }

  private scrollToFirstError() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const firstErrorField = document.querySelector('.form-control.is-invalid');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          (firstErrorField as HTMLElement).focus();
        }
      }, 100);
    }
  }

  getFieldClasses(fieldName: string): string {
    const baseClasses = 'form-control';
    const field = this.contactForm.get(fieldName);

    if (!field) return baseClasses;

    if (this.isFieldInvalid(fieldName)) {
      return `${baseClasses} is-invalid`;
    }

    if (this.isFieldValid(fieldName)) {
      return `${baseClasses} is-valid`;
    }

    return baseClasses;
  }

  onFieldFocus(fieldName: string) {
    const field = this.contactForm.get(fieldName);
    if (field) {
      field.markAsTouched();
    }
  }

  clearForm() {
    this.contactForm.reset();
    this.submitted = false;
    this.formSubmissionMessage = '';
  }
}
