import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false, // للسماح بالتحديث عند تغيير اللغة
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private languageSubscription: Subscription;

  constructor(private translationService: TranslationService) {
    // الاشتراك في تغييرات اللغة لإعادة تشغيل الـ pipe
    this.languageSubscription = this.translationService.currentLanguage$.subscribe();
  }

  transform(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
}
