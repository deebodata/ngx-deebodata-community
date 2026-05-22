import { Injectable } from '@angular/core';
import { DataTableService } from './data-table-service';
import { Subject } from 'rxjs';
import { CommonService } from './common-service';

@Injectable({
  providedIn: 'root'
})
export class TableDragService {

            constructor(private dataTableService: DataTableService,
                        private common: CommonService,
            ) {}
  
            currDataRow: any;
            currColForDataRow: any;
            dTblHeight: number = 500;
            currColumnEdit: string = ""
            listenForMouseUp: boolean = false;
            listenForSelectStart: boolean = false;
            listenForColMvMouseUp: boolean = false;
            colDragStartFrmHeaderTracker: any = { col: null, xstart: null, ystart: null, resized: false }
            colDragStartFrmCellTracker: any = { col: null, row: null, xstart: null, ystart: null, resized: false }
            tblDragStartFrmPagiTracker: any = { row: null, ystart: null, resized: false }
            didResizeOnEvent: boolean = false
            colMoving: boolean = false
            headDims: Subject<any> = new Subject()
            cellDims: Subject<any> = new Subject()
            columnMove: Subject<any> = new Subject()
            dTblHeightOutput: Subject<number> = new Subject()

            checkItemBorderCursor(e: MouseEvent, noColResize?: boolean) {
                try{
                    if(this.colMoving)
                        return
                    const el = e.target
                    if(el instanceof Element && /(col-header|data-cell)/g.test(el.className)){
                      const offsx = 11; const offsy = 9;
                      const cls = "moveable-col"
                      const rcls = "moveable-row"
                      const bds = el.getBoundingClientRect()
                      if(noColResize){
                      } else {
                          if(e.offsetX >= bds.width-offsx){
                              el.classList.add(cls)
                              el.classList.remove(rcls)
                          } else {
                              el.classList.remove(cls)
                          }
                      }
                      if(e.offsetY >= bds.height-offsy){
                          el.classList.add(rcls)
                          el.classList.remove(cls)
                      } else {
                          el.classList.remove(rcls)
                      }
                    }
                }catch(err){}
            }

            checkPaginatorBorderCursor(e: MouseEvent) {
                try{
                    const el = e.target
                    if(el instanceof Element && /data-table-footer/g.test(el.className)){
                      const offsy = 9;
                      const rcls = "moveable-row"
                      const bds = el.getBoundingClientRect()
                      if(e.offsetY >= bds.height-offsy){
                          el.classList.add(rcls)
                      } else {
                          el.classList.remove(rcls)
                      }
                    }
                }catch(err){}
            }

            handleHeaderSizeAdjust(e: any) {
                e && e.preventDefault()
                let col
                const cls = "moveable-col"
                const rcls = "moveable-row"
                const clist = e.target.classList
                if(e.type === "mousedown"){
                    if(e && e.target.id && /columnHeader/g.test(e.target.id))
                        col = e.target
                    if(e && e.target.parentElement.id && /columnHeader/g.test(e.target.parentElement.id))
                        col = e.target.parentElement
                    if(col){
                        const cBds = col.getBoundingClientRect()
                        if(clist.contains(cls)){
                            let rootCol;
                            let useX = e.offsetX
                            if(useX > ((cBds.right-cBds.left)/2)){//the one we're aiming for IS the target
                                useX = (useX - cBds.width)
                                rootCol = col.id.replace(/columnHeader/g, "")
                            } else {
                                if(!col.nextElementSibling && (e.offsetX > ((cBds.right-cBds.left)/2)))//last and grabbing the end of it
                                    rootCol = col.id.replace(/columnHeader/g, "")
                                else
                                    rootCol = col.previousElementSibling.id.replace(/columnHeader/g, "")
                            }
                            this.dataTableService.currColumnEdit =rootCol
                            this.colDragStartFrmHeaderTracker = { col: rootCol, xstart: useX, ystart: null, resized: false }
                            this.listenForMouseUp = true
                        }
    
                        if(clist.contains(rcls)){
                            this.dataTableService.currColumnEdit = null
                            this.colDragStartFrmHeaderTracker = { col: null, xstart: null, ystart: e.pageY, resized: false }
                            this.listenForMouseUp = true
                        }

                        if(!clist.contains(cls) && !clist.contains(rcls)){//drag column to diff position
                            let rootCol;
                            this.colMoving = true
                            rootCol = col.id.replace(/columnHeader/g, "")
                            this.dataTableService.currColumnEdit =rootCol
                            this.colDragStartFrmHeaderTracker = { col: rootCol, xstart: null, ystart: null, resized: false }
                            this.listenForColMvMouseUp = true
                        }
                    }
                }

                if(e.type === "mousemove"){
                    if(!this.colMoving){
                        if(this.colDragStartFrmHeaderTracker.col && this.dataTableService.currColumnEdit === this.colDragStartFrmHeaderTracker.col)
                            this.doHeaderWidth(e)
    
                        if(this.colDragStartFrmHeaderTracker.ystart)
                            this.doHeaderHeight(e)
                    } else {
                        if(this.listenForColMvMouseUp)
                            this.handleColMoveMouseUp(e)
                    }
                }
            }

            handleCellSizeAdjust(e: any, rootCol?: string) {
                let col
                const cls = "moveable-col"
                const rcls = "moveable-row"
                const clist = e.target.classList
                if(e.type === "mousedown" && /data-cell/g.test(e.target.className)){
                    if(e && e.target && /data-cell/g.test(e.target.className))
                        col = e.target
                    if(e && e.target.parentElement && /data-cell/g.test(e.target.parentElement.className))
                        col = e.target.parentElement
                    if(clist.contains(cls)){
                        if(col){
                            let useX = e.offsetX
                            const cBds = col.getBoundingClientRect()
                            if(useX > ((cBds.right-cBds.left)/2)){//the one we're aiming for IS the target
                                useX = (useX - cBds.width)
                            }
                            if(rootCol){
                                this.dataTableService.currColumnEdit =rootCol
                                this.colDragStartFrmCellTracker = { col: rootCol, row: null, xstart: useX, ystart:null, resized: false }
                                this.listenForMouseUp = true
                            }
                        }
                    }

                    if(clist.contains(rcls)){
                        this.dataTableService.currColumnEdit = null
                        if(!this.currDataRow){
                          this.currColForDataRow = rootCol//this lets us process the sub once on a given cell
                          this.currDataRow = document.getElementById(col.getAttribute("data-index"))
                        }
                        this.colDragStartFrmCellTracker = { col: null, row: this.currDataRow, xstart: null, ystart: e.offsetY, resized: false }
                        this.listenForMouseUp = true
                    }
                }
                if(e.type === "mousemove"){
                    if(this.colDragStartFrmCellTracker.col && this.dataTableService.currColumnEdit === this.colDragStartFrmCellTracker.col)
                        this.doCellWidth(e)

                    if(this.colDragStartFrmCellTracker.row && this.colDragStartFrmCellTracker.ystart)
                        this.doRowHeight(e)
                }
            }

            handleTableHeightAdjust(e: any) {
                const rcls = "moveable-row"
                const clist = e.target.classList
                if(e.type === "mousedown" && /data-table-footer/g.test(e.target.className)){
                    this.listenForSelectStart = true
                    if(clist.contains(rcls)){
                        this.tblDragStartFrmPagiTracker = { row: e.target, ystart: e.offsetY, resized: false }
                        this.listenForMouseUp = true
                    }
                }
                if(e.type === "mousemove"){
                    if(this.tblDragStartFrmPagiTracker.row && this.tblDragStartFrmPagiTracker.ystart)
                        this.doTblHeight(e)
                }
            }

            doHeaderWidth(e: any) {
                try{
                    const head = document.getElementById("columnHeader" + this.colDragStartFrmHeaderTracker.col)
                    if(head){
                      const hbds = head?.getBoundingClientRect()
                      const useWid = e.pageX - (hbds.left+window.scrollX)
                      this.colDragStartFrmHeaderTracker.resized = true
                      this.headDims.next({ prop: "width", value: Math.floor(Math.max(30, useWid)) })
                    }
                }catch(err){}
            }

            doHeaderHeight(e: any) {
                try{
                    const hdrs = document.querySelector(".col-header:not(.col-header-minimized)") || document.getElementById("dataTableHeaders")
                    if(hdrs){
                      const hdrbds = hdrs.getBoundingClientRect()
                      const useHgt= e.pageY - (hdrbds.top+window.scrollY)
                      this.colDragStartFrmHeaderTracker.resized = true
                      this.headDims.next({ prop: "height", value: Math.floor(Math.max(30, useHgt)) })
                    }
                }catch(err){}
            }

            doCellWidth(e: any) {
                try{
                    const head = document.getElementById("columnHeader" + this.colDragStartFrmCellTracker.col)//this looks outta place but is ok here
                    if(head){
                      const useWid = e.pageX - (head.getBoundingClientRect().left+window.scrollX)
                      this.colDragStartFrmCellTracker.resized = true
                      this.cellDims.next({ prop: "width", value: Math.floor(Math.max(30, useWid)) })
                    }
                }catch(err){}
            }

            doRowHeight(e: any) {
                try{
                    const rowbds = this.colDragStartFrmCellTracker.row.getBoundingClientRect()
                    const useHgt = e.pageY - (rowbds.top+window.scrollY)
                    this.colDragStartFrmCellTracker.resized = true
                    this.cellDims.next({ row: this.colDragStartFrmCellTracker.row, prop: "height", value: Math.floor(Math.max(30, useHgt)) })
                }catch(err){}
            }

            doTblHeight(e: any) {
                try{
                    const rowbds = this.tblDragStartFrmPagiTracker.row.getBoundingClientRect()
                    const useHgt = e.pageY - (rowbds.bottom+window.scrollY)
                    this.tblDragStartFrmPagiTracker.resized = true
                    let max = 1000
                    if(isNaN(max))
                        max = 700;
                    const tblWant = Math.min((this.dTblHeight + useHgt), max);
                    this.dTblHeight = Math.floor(Math.max(tblWant, 100))
                    this.dTblHeightOutput.next(this.dTblHeight)
                }catch(err){}
            }

            handleColResMouseUp(e: any) {
                try{ e && e.preventDefault() } catch(e) {}
                if(this.colMoving)
                    return;
                this.listenForMouseUp = false
                if(this.colDragStartFrmHeaderTracker.ystart)
                    this.doHeaderHeight(e)
                if(this.colDragStartFrmCellTracker.ystart)
                    this.doRowHeight(e)
                if(this.colDragStartFrmHeaderTracker.col && this.dataTableService.currColumnEdit === this.colDragStartFrmHeaderTracker.col)
                    this.doHeaderWidth(e)
                if(this.colDragStartFrmCellTracker.col && this.dataTableService.currColumnEdit === this.colDragStartFrmCellTracker.col)
                    this.doCellWidth(e)
                if(this.tblDragStartFrmPagiTracker.ystart){
                    this.doTblHeight(e)
                    this.listenForSelectStart = false
                }
                this.didResizeOnEvent = (this.colDragStartFrmCellTracker.resized || 
                    this.colDragStartFrmHeaderTracker.resized || this.tblDragStartFrmPagiTracker.resized)
                this.colDragStartFrmHeaderTracker = { col: null, xstart: null, ystart: null, resized: false }
                this.colDragStartFrmCellTracker = { col: null, row: null, xstart: null, ystart: null, resized: false }
                this.tblDragStartFrmPagiTracker = { row: null, ystart: null, resized: false }
                this.currDataRow = null;
                this.currColForDataRow = null
                if(window.getSelection)
                    window.getSelection()?.removeAllRanges();
                if(this.dataTableService.currColumnEdit){
                    const prop = this.common.replaceUniSep(this.dataTableService.currColumnEdit)
                    if(this.dataTableService.dataFilSrtTracker[prop] && this.dataTableService.dataFilSrtTracker[prop].colWidth){
                        const useWid = Math.min(2500, (parseInt(this.dataTableService.dataFilSrtTracker[prop].colWidth.replace(/[ ]?px/g, ""))))
                        this.cellDims.next({ prop: "width", value: (Math.floor(Math.max(50, useWid))) })
                    }
                }
                setTimeout( () => { //let the click event process first
                    this.dataTableService.currColumnEdit = null
                    this.didResizeOnEvent = false 
                    if(window.getSelection)
                        window.getSelection()?.removeAllRanges();
                })
            }

            handleColMoveMouseUp(e: any) {
                try{ e && e.preventDefault() } catch(e) {}
                const isMUp = e && e.type === "mouseup";
                if(isMUp){
                    this.listenForColMvMouseUp = false
                    this.didResizeOnEvent = true
                    this.colDragStartFrmHeaderTracker = { col: null, xstart: null, ystart: null, resized: false }
                }
                if(this.colMoving){
                    if(window.getSelection)
                        window.getSelection()?.removeAllRanges();
                    if(this.dataTableService.currColumnEdit){
                        const colRef = document.getElementById("columnHeader" + this.dataTableService.currColumnEdit)
                        if(colRef){
                          let xDrop = e.clientX
                          let i = 0;
                          let lfts = []
                          let wantlfts = []
                          const cols = document.getElementsByClassName("col-header")
                          const len = cols.length
                          const nwColLft = Math.floor(colRef.getBoundingClientRect().left)
                          for(i; i < len; i++){
                              const col = cols[i]
                              if(!col.classList.contains("col-header-minimized")){
                                  const elLft = Math.floor(col.getBoundingClientRect().left)
                                  lfts.push(elLft)
                                  if(col.id !== colRef.id)
                                      wantlfts.push(elLft)
                              }
                          }
                          wantlfts.push(xDrop)
                          wantlfts = wantlfts.sort( (a, b) => a-b )
                          if(lfts.length && lfts.length === wantlfts.length)
                            this.columnMove.next({ ls: lfts, nl: nwColLft, wl: wantlfts, x: xDrop })
                        }
                    }
                    if(isMUp){
                        setTimeout( () => { //let the click event process first
                            this.dataTableService.currColumnEdit = null
                            this.didResizeOnEvent = false
                            this.colMoving = false
                        })
                    }
                }
            }

            stopWindowSelection(e: any) {
                e.preventDefault()
                return false;
            }
}
