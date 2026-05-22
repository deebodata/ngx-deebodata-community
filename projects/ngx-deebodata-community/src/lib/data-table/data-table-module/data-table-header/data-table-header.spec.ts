import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableHeader } from './data-table-header';

describe('DataTableHeader', () => {
  let component: DataTableHeader;
  let fixture: ComponentFixture<DataTableHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataTableHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
