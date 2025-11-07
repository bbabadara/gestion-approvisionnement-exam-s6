import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListApprovisionnement } from './list';

describe('ListApprovisionnement', () => {
  let component: ListApprovisionnement;
  let fixture: ComponentFixture<ListApprovisionnement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListApprovisionnement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListApprovisionnement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
