import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { DataCell } from '../../../interfaces/data-cell';
import { CommonService } from '../../../services/common-service';
import { TableDragService } from '../../../services/table-drag-service';
import { CommonModule } from '@angular/common';
import { DataTableService } from '../../../services/data-table-service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-data-cell',
  imports: [CommonModule],
  templateUrl: './data-cell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./data-cell.css', '../../../styles.css']
})
export class DataCellComponent {

  constructor(public tblDragService: TableDragService,
              public dataTableService: DataTableService,
              private common: CommonService,) {

  }

  init = true
  ready = false
  canEdit = false
  elCol: string = ""
  cellStyle: any = {}
  inlineLink = false;
  scrollOnTab: boolean = false;
  setCellEditScrlActionTO: any = null;
  @Input() text: string = "";
  @Input() html: string = "";
  @Input() rawText: any;
  @Input() cell!: DataCell;
  @Input() rowId: string = "";//starts with dataTableRow
  @Input() colWid: string = "";
  @Input() rowHeight: string = "";
  @Input() noColResize: boolean = false;
  @Output("width") width: EventEmitter<number> = new EventEmitter()
  @Output("height") height: EventEmitter<any> = new EventEmitter()
  @Output("edit") edit: EventEmitter<any> = new EventEmitter()
  @Output("dragListen") dragListen: EventEmitter<any> = new EventEmitter()
  @Output("validateEditFocus") validateEditFocus: EventEmitter<any> = new EventEmitter()
  @Output("clearVEditFocus") clearVEditFocus: EventEmitter<any> = new EventEmitter()
  @ViewChild('cellEl', { static: true }) cellElem!: ElementRef<HTMLElement>
  rightAlign: string = "";//for numbers, always add a space in front
  symbolCls: string = "";//also for numbers only, always add a space in front

  ngOnChanges(changes: SimpleChanges) {
    if(!this.init){
      if(this.cell.visible || changes["rowHeight"]){
        if(typeof changes !== "undefined" && (changes["cell"] || changes["rowHeight"] || changes["colWid"]))
          this.applyDimensions()
        if(this.cell.visible && !this.ready)
          this.handleSettingText()
      }
      if(this.cell.visible && (changes["cell"] || changes["text"] || changes["html"]))
        this.handleSettingText()
    }
  }

  ngOnInit() {
    if(this.cell.visible)
      this.applyDimensions()
    if(this.cell.column)
      this.elCol = this.common.elifyCol(this.cell.column) 
    this.rightAlign = this.cell.dataType === "number" ? " data-cell-riiight" : "";
    this.applySymbol()
    this.canEdit = this.cell.editable && !this.validateEdit()//to see if free text edit
    this.init = false
    this.tblDragService.cellDims.subscribe( d => { this.updateUiColCellTheme(d.prop, d.value) })
  }

  ngAfterViewInit() {
    if(this.cell.visible)
      this.handleSettingText()
    this.isLastCellInRow()
  }

  validateEdit(): boolean {
    if(!this.cell.html && (["number", "date"].includes(this.cell.dataType)))
      return true
    return false
  }
  
  applySymbol() {
    const sym = this.dataTableService.dataFilSrtTracker[this.cell.column]["colCellSymbol"];
    if(sym){
        this.symbolCls = ["$","€","£","¥","₣","₹"].indexOf(sym) > -1 ? " has-symbol-b" : " has-symbol";
        this.cellElem.nativeElement.setAttribute("data-symbol", sym)
    }
  }

  handleSettingText(force?: boolean) {
      if(this.cell.text || (this.cell.html && !/<img/g.test(this.cell.html)))
        return this.setCellText(force)
      if(this.cell.html)
        timer(100).subscribe( () => { this.setCellText(force) })
  }

  isLastCellInRow(): boolean {
    const nxtCell: HTMLElement = <HTMLElement>this.cellElem.nativeElement?.parentElement?.nextElementSibling
    if(!nxtCell)
      this.scrollOnTab = true
    return this.scrollOnTab
  }

  setCellText(force?: boolean) {
    const cell = this.cellElem.nativeElement
    if(this.text && (!cell.textContent || force)){
      cell.textContent = this.text
      cell.style.removeProperty("display")
    }
    if(this.html && (!cell.innerHTML || force)){
      cell.innerHTML = this.html
      if(/ \<a/g.test(this.html) || /a\> /g.test(this.html))
        cell.style.display = "inline-block"
      else
        cell.style.removeProperty("display")
    }
    this.ready = true
    if(this.html && !this.ready){
      timer(0).subscribe( () => {
        const ancOIm = (document.querySelector("#" + this.rowId + " .data-cell-" + this.elCol + " a") || 
        document.querySelector("#" + this.rowId + " .data-cell-" + this.elCol + " img"))
        if(ancOIm){
          ancOIm.addEventListener("mousemove", e => { e && e.stopPropagation() })
          ancOIm.addEventListener("mousedown", e => { e && e.stopPropagation() })
          ancOIm.addEventListener("mouseup", e => { e && e.stopPropagation() })
        }
      })
    }
  }

  applyDimensions() {
    this.cellStyle = { "width": (this.cell.width || this.colWid), "height": this.rowHeight }
  }

  updateUiColCellTheme(cssProp: string, val: number) {
      const rProp = this.common.replaceUniSep(this.tblDragService.currColForDataRow)
      if(cssProp === "height" && (this.cell.column === this.tblDragService.currColForDataRow || this.cell.column === rProp) && 
      this.tblDragService.currDataRow.id === this.rowId)
        this.height.emit(val)
      const prop = this.common.replaceUniSep(this.dataTableService.currColumnEdit)
      if(prop && this.dataTableService.dataFilSrtTracker[prop]){
          if(cssProp === "width"){
              this.dataTableService.dataFilSrtTracker[prop].colWidth = (val || parseInt(this.colWid)).toString() + "px"
              this.width.emit(val || parseInt(this.colWid))
          }    
      }
  }

  handleColResDblClick(prop: string) {
    if(this.dataTableService.dataFilSrtTracker[prop]){
          let i = 0
          let wids = []
          let useWid = 50
          const elCol = this.common.elifyCol(prop)
          const els = document.getElementsByClassName("data-cell-" + elCol)
          const nw = els[0]?.getBoundingClientRect().width || 0
          const len = els.length
          for(i; i < len; i++)
              wids.push(els[i].scrollWidth)
          useWid =wids.sort()[(len-1)]
          if(useWid && useWid > nw){
            const cswid = (Math.ceil(useWid+1))
            this.dataTableService.currColumnEdit = elCol
            this.updateUiColCellTheme("width", cswid)
            setTimeout( () => this.dataTableService.currColumnEdit = null)
          }
      }
  }

  validateRawText(text: string, dataType: string): string {
    if(dataType === "number" && (!text || /[a-zA-Z \/]/g.test(text)))
      return ""
    return text
  }

  setToEditAfterTO() {
      this.setCellEditScrlActionTO = timer(100).subscribe( () => {
        if(this.dataTableService.currEditCol === this.cell.column)
          this.setCellToEdit(true)
        timer(0).subscribe( () => {this.dataTableService.autoScrollOnEdit = false; })
      })
  }

  setCellToEdit(noHScrl?: boolean) {
      if(this.tblDragService.didResizeOnEvent || this.dataTableService.lockCellFocus() || !this.cell.editable){
          if(!this.cell.editable && !this.dataTableService.lockCellFocus()){
            this.dataTableService.clearAllFocused()
            this.dataTableService.clearDCellFcsd()
            this.clearVEditFocus.emit("")
            this.dataTableService.currEditCol = ""
            this.setCellEditScrlActionTO = null;
            this.dataTableService.autoScrollOnEdit = false
            this.dataTableService.currEditIndex = -1
          }
          return//not editable or was really a drag event, not click
      }
      this.dataTableService.currEditCol = this.cell.column
      this.dataTableService.currEditIndex = parseInt(this.rowId.replace(/^dataTableRow/, ""))
      const cell = this.cellElem.nativeElement
      if(!this.canEdit && !this.cell.html)
        this.dataTableService.lockCellFocus.set(true);
      const cellWid = parseInt(this.dataTableService.useColWid?.replace(/px/g, "") || "250")
      if(cell.getBoundingClientRect().right+cellWid >= this.dataTableService.tblRight){
          if(!noHScrl){
              this.dataTableService.autoScrollOnEdit = true
              const grid = <HTMLElement>document.getElementById("dataTableBody")
              grid.scrollBy((cellWid+1), 0)
          }
          if(!this.setCellEditScrlActionTO){
              return this.setToEditAfterTO()
          } else {
              window.clearTimeout(this.setCellEditScrlActionTO)
          }
      }
      this.dataTableService.clearAllFocused()
      this.dataTableService.clearDCellFcsd()
      this.setCellEditScrlActionTO = null;
      timer(0).subscribe( () => {this.dataTableService.autoScrollOnEdit = false })
      if(this.needsVal()){
        const okText = this.validateRawText(this.cell.rawText, this.cell.dataType)
        if(this.cell.rawText && !okText)
          return;
        this.validateEditFocus.emit({type: this.cell.dataType, value: okText})
        return;
      }
      this.clearVEditFocus.emit("")
      timer(0).subscribe( () => {
        const fCellDragger = <HTMLElement>document.getElementsByClassName("focused-cell-dragger")[0]
        const par = fCellDragger?.parentElement
        if(fCellDragger && par){
          const cbds = cell.getBoundingClientRect()
          const rbds = par.getBoundingClientRect()
          fCellDragger.style.left = (Math.ceil(cbds.left-rbds.left) + cbds.width - 4) + "px";
          fCellDragger.style.top = (Math.ceil(cbds.bottom-rbds.top) - 4) + "px";
        }
      })
  }

  needsVal(): boolean {
    if(!this.cell.html && (["number", "date"].includes(this.cell.dataType)))
      return true
    return false
  }

  emitEdit(event: any) {
    if(!this.cell.editable || this.needsVal()/*only for validated edits*/ || 
      (event.relatedTarget && event.relatedTarget.classList.contains("edit-input")))
        return;
    this.execFreeEdit()
  }

  checkNeedsSroll() {
      if(this.scrollOnTab){
        this.dataTableService.autoScrollOnEdit = true
        this.dataTableService.scrollBodyForTabbing()
      }
  }

  execFreeEdit() {
    const el = this.cellElem.nativeElement
    const val = el.textContent
    if(val !== this.rawText)
      this.edit.emit({ column: this.cell.column, value: val })
    else{
      setTimeout( () => {
        const actEl = document.activeElement
        if(actEl && actEl.id === "fCellDragger"){
          el.classList.add("dragger-cell-focused")
          this.dragListen.emit(true)
        } else {
            if(!actEl || (actEl && !/data-cell/g.test(actEl?.className))){
              this.dataTableService.currEditIndex = -1
              const fCellDragger = <HTMLElement>document.getElementsByClassName("focused-cell-dragger")[0]
              if(fCellDragger && !this.dataTableService.autoScrollOnEdit){
                fCellDragger.style.removeProperty("top")
                fCellDragger.style.removeProperty("left")
              }
            }
        }
      })
    }
  }

}
