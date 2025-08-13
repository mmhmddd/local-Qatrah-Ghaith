import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-new-section',
  standalone: true,
  imports: [CommonModule , RouterLink],
  templateUrl: './new-section.component.html',
  styleUrl: './new-section.component.scss'
})
export class NewSectionComponent {

}
