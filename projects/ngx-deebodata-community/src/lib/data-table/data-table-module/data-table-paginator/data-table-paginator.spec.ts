import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTablePaginator } from './data-table-paginator';

describe('DataTablePaginator', () => {
  let component: DataTablePaginator;
  let fixture: ComponentFixture<DataTablePaginator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTablePaginator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataTablePaginator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
