/* Requires an explicitly supplied, locally bundled and reviewed SheetJS library. */
(function(root){
"use strict";
function preview(buffer,xlsx, sheetName){
 if(!xlsx||!xlsx.read||!xlsx.utils?.sheet_to_csv)throw Error("Pembaca Excel belum tersedia");
 if(buffer.byteLength>5000000)throw Error("Fail melebihi 5 MB");
 const book=xlsx.read(buffer,{type:"array",sheetRows:502});
 const name=sheetName||book.SheetNames[0];
 if(!name||!Object.prototype.hasOwnProperty.call(book.Sheets,name))throw Error("Sheet tidak dijumpai");
 const sheet=book.Sheets[name];
 const rows=root.AdaTikTokImport.preview(xlsx.utils.sheet_to_csv(sheet,{blankrows:false}));
 if(rows.length>500)throw Error("Maksimum 500 rekod setiap import");
 return rows;
}
root.AdaTikTokExcel={preview};
})(globalThis);
