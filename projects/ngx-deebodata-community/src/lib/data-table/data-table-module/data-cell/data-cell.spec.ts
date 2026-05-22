import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCell } from './data-cell';

describe('DataCell', () => {
  let component: DataCell;
  let fixture: ComponentFixture<DataCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
