import { Component, EventEmitter, Input, Output, SimpleChanges, } from '@angular/core';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableDragService } from '../../../services/table-drag-service';
import { CommonService } from '../../../services/common-service';

@Component({
  selector: 'app-data-table-paginator',
  imports: [CommonModule, FormsModule,],
  templateUrl: './data-table-paginator.html',
  styleUrls: ['./data-table-paginator.css', '../../../styles.css']
})
export class DataTablePaginator {

    constructor(public dataTableService: DataTableService,
                public tblDragService: TableDragService,
                public common: CommonService,) {

    }

    init = true
    isKeying = false
    totalRowStr = "";
    rowinating = false
    @Input() totalRows: number = 0;
    @Input() filSortStr: string = "";

    ngOnChanges(changes: SimpleChanges){
        if(!this.init && changes){
            if(changes["totalRows"])
                this.setUpPagi()
        }
    }

    ngOnInit() {
        this.setUpPagi()
        this.init = false
    }

    setUpPagi() {
        this.totalRowStr = this.totalRows.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }

}
