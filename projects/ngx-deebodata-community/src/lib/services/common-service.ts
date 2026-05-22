import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

        uniSep: string = "X_";

        replaceUniSep(val: any) {
            return (val && typeof val === "string") ? val.replace(/\X_/g, " ") : (val ? val : null)
        }

        elifyCol(col: string) {
            return col.replace(/ /g, this.uniSep)
        }

        titleCase(str: any) {
            if(!str || str === "")
                return str
            return str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substring(1) );
        }
  
        idCol(col: string) { 
            if(col && (col === "id" || col === "ID" || col === "Id" || /[Z+z+][I+i+][P+p+][ _\-]?/g.test(col)) || /[S+s+][S+s+][N+n+][ _\-]?/g.test(col))
                return true
            return col && typeof col === "string" && col.toLocaleLowerCase().endsWith("id") && /[-_ ][I+i+][D+d+]/g.test(col)
        }

        mapLongDate(val: string) {
            let dtStr = ""
            let yrStr = ""
            const dt = val.match(/\d{1,2}\,/g)
            const yr = val.match(/ \d{4}/g)
            if(dt && dt.length)
                dtStr = dt[(dt.length-1)]
            if(yr && yr.length)
                yrStr = yr[(yr.length-1)]
            if(!dt || !yr)
                return new Date(val)
            return new Date(yrStr + "," + this.mapTxtMonths(val) + "," + dtStr)
        }

        mapTxtMonths(val: string) {
            if(/(jan|january)/g.test(val))
                return "01"
            if(/(feb|february)/g.test(val))
                return "02"
            if(/(mar|march)/g.test(val))
                return "03"
            if(/(apr|april)/g.test(val))
                return "04"
            if(/may/g.test(val))
                return "05"
            if(/(jun|june)/g.test(val))
                return "06"
            if(/(jul|july)/g.test(val))
                return "07"
            if(/(aug|august)/g.test(val))
                return "08"
            if(/(sept|september)/g.test(val))
                return "09"
            if(/(oct|october)/g.test(val))
                return "10"
            if(/(nov|november)/g.test(val))
                return "11"
            if(/(dec|december)/g.test(val))
                return "12"
            return "06"
        }

        testShortDate(val: string) {
            const isDtReg = new RegExp(/\d+(\/|-| )\d+(\/|-| )\d+/)
            if(val && isDtReg.test(val) && /^\d+$/g.test(val.replace(/(\/|-| )/g, "")) && val.length <= 10)
                return true
            return false
        }

        testISODate(val: string) {
            return (val && /\d{4}-[01]\d-[0-3]\d(T|t)[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|(Z|z))/.test(val)) ? true : false
        }

        testLongDate(val: string) {
            const dtReg = /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sept|september|oct|october|nov|november|dec|december) \d{1,2}\, \d{4}/
            if(val && dtReg.test(val) && val.length < 29)
                return true
            return false
        }

        coerceDate(val: any) {
            try{
                if(!val)
                    return null
                if(this.testLongDate(val))
                    return this.mapLongDate(val)
                const fFour = val.substring(0,4)
                const moGuess = val.substring(5,7)
                const dtGuess = val.substring(8,10)//2024-10-30
                if((this.testISODate(val.replace(/ /g, "")) || (/^\d+$/g.test(fFour) && /^\d+$/g.test(moGuess) && /^\d+$/g.test(dtGuess))))
                    return new Date(fFour + "," + moGuess + "," + dtGuess)
                if(/\d{2}(\/|-| )\d{2}(\/|-| )\d{4}/g.test(val))//10-30-2023
                    return new Date(val.substring(6,10) + "," + (val.substring(0,2)) + "," + val.substring(3,5))
                if(/\d{2}(\/|-| )\d{1}(\/|-| )\d{4}/g.test(val))//10-5-2023
                    return new Date(val.substring(5,9) + "," + (val.substring(0,2)) + "," + ("0"+val.substring(3,4)))
                if(/\d{1}(\/|-| )\d{2}(\/|-| )\d{4}/g.test(val))//5-26-2025
                    return new Date(val.substring(5,9) + "," + ("0"+val.substring(0,1)) + "," + val.substring(2,4))
                if(/\d{1}(\/|-| )\d{1}(\/|-| )\d{4}/g.test(val))//5-6-2025
                    return new Date(val.substring(4,8) + "," + ("0"+val.substring(0,1)) + "," + ("0"+val.substring(2,3)))

                if(/\d{2}(\/|-| )\d{2}(\/|-| )\d{2}/g.test(val))//10-30-23
                    return new Date(("20" + val.substring(6,8)) + "," + (val.substring(0,2)) + "," + val.substring(3,5))
                if(/\d{2}(\/|-| )\d{1}(\/|-| )\d{2}/g.test(val))//11-6-25
                    return new Date(("20" + val.substring(5,7)) + "," + (val.substring(0,2)) + "," + ("0"+val.substring(3,4)))
                if(/\d{1}(\/|-| )\d{2}(\/|-| )\d{2}/g.test(val))//5-16-25
                    return new Date(("20" + val.substring(5,7)) + "," + ("0"+val.substring(0,1)) + "," + val.substring(2,4))
                if(/\d{1}(\/|-| )\d{1}(\/|-| )\d{2}/g.test(val))//5-6-25
                    return new Date(("20" + val.substring(4,6)) + "," + ("0"+val.substring(0,1)) + "," + ("0"+val.substring(2,3)))
                
                if(/\d{4}(\/|-| )\d{2}(\/|-| )\d{2}/g.test(val))//2025-12-16
                    return new Date(val.substring(0,4) + "," + (val.substring(5,7)) + "," + val.substring(8,10))
                if(/\d{4}(\/|-| )\d{2}(\/|-| )\d{1}/g.test(val))//2025-12-6
                    return new Date(val.substring(0,4) + "," + (val.substring(5,7)) + "," + ("0"+val.substring(8,9)))
                if(/\d{4}(\/|-| )\d{1}(\/|-| )\d{2}/g.test(val))
                    return new Date(val.substring(0,4) + "," + ("0"+val.substring(5,6)) + "," + val.substring(7,9))
                if(/\d{4}(\/|-| )\d{1}(\/|-| )\d{1}/g.test(val))//2025-6-5
                    return new Date(val.substring(0,4) + "," + ("0"+val.substring(5,6)) + "," + ("0"+val.substring(7,8)))
                return val
            } catch(e){
                return val
            }
        }

        isADateObject(val: any) {
            return val && typeof val === "object" && typeof val.getTime === "function"
        }

        stripSpecChars(word: any) {
            try{
                const okword = word?.trim().replace(/[~_\-]/g, " ").replace(/[`!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/g, "").replace(/   /g, " ").replace(/  /g, " ").replace(/^\d+/, '').trim()
                return okword
            } catch(e){ return word }
        }

        doBigData(num: number) {
            try{
                let str = num ? num.toLocaleString(undefined, { maximumFractionDigits: 1 }).split(".")[0] : '0'
                if(num){
                    let arr = str.split(",")
                    let dec;
                    if(arr.length > 0)
                        dec = arr[1].substring(0, 1)
                    str = str.
                    replace(/,\d{3},\d{3},\d{3}/, (dec === "0" ? "B" : ("." + dec + "B"))).
                    replace(/,\d{3},\d{3}/, (dec === "0" ? "M" : ("." + dec + "M"))).
                    replace(/,\d{3}/, (dec === "0" ? "K" : ("." + dec + "K")))
                }
                return str
            } catch(e){
                return num ? num.toLocaleString(undefined, { maximumFractionDigits: 1 }).
                replace(/,\d{3},\d{3},\d{3}/,"B").
                replace(/,\d{3},\d{3}/,"M").
                replace(/,\d{3}/,"K") : '0'
            }
        }

        mystartsWith(str: string, query: string) {
            try{
                var qLen = query.length
                return str.substring(0, qLen) === query ? true : false
            }catch(e){ return false }
        }

        isEnterKey(event: any) {
            if(event){
                if (typeof event.key !== "undefined") {
                    return event.key === 'Enter'
                } else if (typeof event.keyIdentifier !== "undefined") {
                    return event.keyIdentifier === 'Enter'
                } else if (typeof event.keyCode !== "undefined") {
                    return event.keyCode === 13
                }
                return false
            }
            return false
        }

        isTabKey(event: any) {
            if(event){
                if (typeof event.key !== "undefined") {
                    return event.key === 'Tab'
                } else if (typeof event.keyIdentifier !== "undefined") {
                    return event.keyIdentifier === 'Tab'
                } else if (typeof event.keyCode !== "undefined") {
                    return event.keyCode === 9
                }
                return false
            }
            return false
        }

        keyCanSearch(event: any) {
            return (this.isSearchKey(event) ||
            this.isBackKey(event) ||
            this.isDeleteKey(event) ||
            this.isSpaceKey(event))
        }

        isSearchKey(event: any) {
            if (event && event.key !== undefined) {
                return /^[A-Za-z0-9, ()&:\-.,#$!@]$/.test(event.key)
            } else if (event.keyIdentifier !== undefined) {
                return (/Key([a-zA-Z])/.test(event.keyIdentifier) || 
                        this.mystartsWith(event.keyIdentifier, "Digit") ||
                        this.mystartsWith(event.keyIdentifier, "Numpad"))
            } else if (event.keyCode !== undefined) {
                return ((event.keyCode >= 65 && event.keyCode <= 90) || 
                        (event.keyCode >= 48 && event.keyCode <= 57) ||
                        (event.keyCode >= 96 && event.keyCode <= 105))
            }
            return false
        }

        isBackKey(event: any) {
            if (event && event.key !== undefined) {
                return event.key === 'Backspace'
            } else if (event.keyIdentifier !== undefined) {
                return event.keyIdentifier === 'Backspace'
            } else if (event.keyCode !== undefined) {
                return event.keyCode === 8
            }
            return false
        }

        isDeleteKey(event: any) {
            if (event && event.key !== undefined) {
                return event.key === 'Delete'
            } else if (event.keyIdentifier !== undefined) {
                return event.keyIdentifier === 'Delete'
            } else if (event.keyCode !== undefined) {
                return event.keyCode === 46
            }
            return false
        }

        isSpaceKey(event: any) {
            if (event && event.key !== undefined) {
                return event.key == " "
            } else if (event.keyIdentifier !== undefined) {
                return event.keyIdentifier == " "
            } else if (event.keyCode !== undefined) {
                return event.keyCode === 32
            } else if (event.code !== undefined) {
                return event.code === "Space"
            }
            return false
        }

        isDownKey(event: any) {
            if (event && event.key !== undefined) {
                return event.key === 'ArrowDown'
            } else if (event.keyIdentifier !== undefined) {
                return event.keyIdentifier === 'ArrowDown'
            } else if (event.keyCode !== undefined) {
                return event.keyCode === 40
            }
            return false
        }

        isUpKey(event: any) {
            if (event && event.key !== undefined) {
                return event.key === 'ArrowUp'
            } else if (event.keyIdentifier !== undefined) {
                return event.keyIdentifier === 'ArrowUp'
            } else if (event.keyCode !== undefined) {
                return event.keyCode === 38
            }
            return false
        }


        dontSan(val: any) {
            if(val && (this.testShortDate(val) || this.testISODate(val)))
                return true
            return false
        }

        sanitizeUi(val: any) {
            if(val){
                if(this.dontSan(val))
                    return val;
                var entityMap: any = {
                    '<': '&lt;',
                    '>': '&gt;',
                };
    
                return typeof val === "string" ? val.replace(/[<>]/g, s => {
                    return entityMap[s];
                }) : val
            } else
            return val === 0 ? val : ''
        }

        unbindMouseEvent(e: any) {
            e && e.stopPropagation()
        }

        getRgbParts(rgb: string) {
            try{
                const clst = rgb.replace(/rgb[\(\)]/g, "").split(",")
                return {r: parseInt(clst[0].trim()), g: parseInt(clst[1].trim()), b: parseInt(clst[2].trim())}
            } catch(e) { return {r: 255, g: 255, b: 255} }
        }

        componentToHex(c: any) {
            const hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        rgbToHex(r: any, g: any, b: any) {
            return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
        }

        hexToRgb(hex: any) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
}
