import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from "../../pipes/translate.pipe";

@Component({
  selector: 'app-new-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './new-section.component.html',
  styleUrl: './new-section.component.scss',
  providers: [TranslationService]
})
export class NewSectionComponent {
  constructor(public translationService: TranslationService) {}

  newsItems = [
    { text: 'news.item1' },
    { text: 'news.item2' },
    { text: 'news.item3' }
  ];
}
