import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTestimonialsComponent } from './add-testimonials.component';

describe('AddTestimonialsComponent', () => {
  let component: AddTestimonialsComponent;
  let fixture: ComponentFixture<AddTestimonialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTestimonialsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddTestimonialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
