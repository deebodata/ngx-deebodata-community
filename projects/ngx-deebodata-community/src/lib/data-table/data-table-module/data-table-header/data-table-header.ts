import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, } from '@angular/core';
import { ColumnHeader } from '../../../interfaces/column-header';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableDragService } from '../../../services/table-drag-service';

export interface columnWidthResize{
    column: string
    value: number
}

@Component({
  selector: 'app-data-table-header',
  imports: [CommonModule, FormsModule, DecimalPipe, ],
  templateUrl: './data-table-header.html',
  styleUrls: ['./data-table-header.css', '../../../styles.css']
})
export class DataTableHeader {

  constructor(public common: CommonService, 
              public tblDragService: TableDragService,
              public dataTableService: DataTableService,){
    
  }

  init = false;
  showBtnX = false;
  autoMaxed = false
  text: string = ""
  elCol: string = "";
  canTabScroll = true
  compOpts: string[] = []
  filterBuildUp: any[] = []
  @Input() colWid: string = "";
  @Input() canFreeze: boolean = false;
  @Input() columnHeader!: ColumnHeader;
  @Output("sort") sort: EventEmitter<string> = new EventEmitter()
  @Output("render") render: EventEmitter<any> = new EventEmitter()
  @Output("width") width: EventEmitter<columnWidthResize> = new EventEmitter()
  @Output("height") height: EventEmitter<number> = new EventEmitter()
  @Output("reset") reset: EventEmitter<string> = new EventEmitter()
  @Output("freeze") freeze: EventEmitter<string> = new EventEmitter()
  @Output("scrollOnFocus") scrollOnFocus: EventEmitter<string> = new EventEmitter()
  @ViewChild('colHeader', { static: true }) colHeaderEl!: ElementRef<HTMLElement>
  @ViewChild('filterInput', { static: true }) filterInputEl!: ElementRef<HTMLInputElement>
  @ViewChild('compSelect', { static: true }) compSelectEl!: ElementRef<HTMLSelectElement>

  ngOnInit() {
    this.elCol = this.common.elifyCol(this.columnHeader.column)
    this.text = this.common.titleCase(this.columnHeader.column)
    this.compOpts = [...this.dataTableService.comparatorOpts[this.columnHeader.dataType]]
    this.tblDragService.headDims.subscribe( d => { this.updateUiColCellTheme(d.prop, d.value) })
    this.dataTableService.setIdealColumnWidth.subscribe( c => { this.handleColResDblClick(this.columnHeader.column, true) })
  }

  ngAfterViewInit() {
    if(this.columnHeader.dataType === "date"){
        setTimeout( () => {
            this.filterInputEl?.nativeElement.addEventListener("change", e => { this.filterDateOnKeyUp(e) })
        })
    }
  }

  preventTabScroll() {
    this.canTabScroll = false
  }

  emitTabFocus(col: string) {
    if(this.canTabScroll)
        this.scrollOnFocus.emit(col)
  }

  freezeColOnClick(e: any, prop: string) {
        e && e.stopPropagation()
        try{
            const currCol = this.dataTableService.dataFilSrtTracker[prop]
            if(currCol){
                this.dataTableService.dataFilSrtTracker[prop].freeze = !currCol.freeze
                const nowVal = this.dataTableService.dataFilSrtTracker[prop].freeze
                if(nowVal)
                    this.columnHeader.freeze = true
                else
                    this.columnHeader.freeze = false
                this.freeze.emit(prop)
            }
        }catch(e){}
  }

  doSortOnClick(e: any, col: string) {
    e && e.stopPropagation()
    this.canTabScroll = true
    if(!this.dataTableService.isSorting){
        this.dataTableService.isSorting = true
        setTimeout( () => {
            this.dataTableService.doSortOnField(col)
            this.render.emit({value: (this.dataTableService.dataFilSrtTracker[col].filter || ""), field: col})
            if(!this.dataTableService.currSelRows.length && this.dataTableService.arefilSrtTrkPropsDefault())
                this.reset.emit(col)
            this.dataTableService.isSorting = false
        })
    }
  }

  resetColFilter(event: any, field: string) {
      event && event.stopPropagation()
      const fil = this.filterInputEl.nativeElement
      const comp = this.compSelectEl.nativeElement
      if(fil){
          fil.value = "";
          comp.value = ""
          this.dataTableService.dataFilSrtTracker[field].comparator = null
          this.filterOnKeyUp(event, field, "", true)
      }
  }

  filterDateOnKeyUp(event: any) {
    const elId: string = event.target?.id?.replace(/filter/g, "")
    const field: string = this.common.replaceUniSep(elId)
    this.filterOnKeyUp(event, field, event.target.value)
  }

  filterOnKeyUp(event:any, field: string, val: any, manual?: any) {
      const filObj = {value: val, field: field}
      if(field && !this.dataTableService.isFiltering){
          if(!manual && event && event.type !== "change" && !this.common.keyCanSearch(event))
            return;
          this.dataTableService.isFiltering = true
          this.dataTableService.dataFilSrtTracker[field].filter = val || ""
          this.dataTableService.columnFilter(this.dataTableService.mainData, field, this.dataTableService.dataFilSrtTracker, this.dataTableService.sortOrder, manual)
          this.render.emit(filObj)
          setTimeout( () => { 
            this.dataTableService.isFiltering = false
              const buildUpLen = this.filterBuildUp.length
              if(buildUpLen){
                  const filBld = this.filterBuildUp[(buildUpLen-1)]
                  this.filterOnKeyUp(null, filBld.field, filBld.value, true)
                  this.filterBuildUp = []
                  if((this.dataTableService.dataFilSrtTracker[field].filter || 
                      (this.dataTableService.dataFilSrtTracker[field].comparator && this.dataTableService.dataFilSrtTracker[field].comparator != "Equals")
                  )){
                    this.showBtnX = true
                  } else {
                      this.showBtnX = false
                  }
              } 
          }, 500)
          if((this.dataTableService.dataFilSrtTracker[field].filter || 
              (this.dataTableService.dataFilSrtTracker[field].comparator && this.dataTableService.dataFilSrtTracker[field].comparator != "Equals")
          )){
              this.showBtnX = true
          } else {
              this.showBtnX = false
          }
          const tlFil = <HTMLInputElement>document.getElementsByName("topLevelDataFilter")[0]
          if(tlFil)
            tlFil.value = ""
      } else {
          if(!this.filterBuildUp.find( f => f.value === val && f.field === field))
            this.filterBuildUp.push(filObj)
      }
  }

  handleComparatorChange(col: string, comp: string) {
      if(col){
        const value = this.dataTableService.dataFilSrtTracker[col].filter
        this.dataTableService.dataFilSrtTracker[col].comparator = comp
        this.filterOnKeyUp(null, col, (value || ""), true)
      }
  }

  updateUiColCellTheme(cssProp: string, val: number, col?: string) {
    if(cssProp === "height")
        this.height.emit(val)
      const prop = col || this.common.replaceUniSep(this.dataTableService.currColumnEdit)
      if(prop && this.dataTableService.dataFilSrtTracker[prop]){
          if(cssProp === "width"){
              this.dataTableService.dataFilSrtTracker[prop].colWidth = (val || parseInt(this.colWid)).toString()
              this.width.emit({column: prop, value: val || parseInt(this.colWid)})
          }    
      }
  }

  handleColResDblClick(prop: string, auto?: boolean) {
        if(this.dataTableService.dataFilSrtTracker[prop] && (!auto || (!this.autoMaxed && this.dataTableService.visibleCols.includes(prop)))){
            let i = 0
            let wids = []
            let useWid = 50
            const els = document.getElementsByClassName("data-cell-" + this.common.elifyCol(prop))
            const nw = els[0]?.getBoundingClientRect().width || 0
            const len = els.length
            if(len){
                for(i; i < len; i++)
                    wids.push(els[i].scrollWidth)
                useWid =wids.sort()[(len-1)]
                if(useWid && useWid > nw){
                    const cswid = Math.ceil(Math.max((useWid+1), parseInt(this.dataTableService.useColWid.replace(/[ ]?px/g, ""))))
                    this.updateUiColCellTheme("width", cswid, prop)
                    this.autoMaxed = true
                }
            }
        }
    }

}
