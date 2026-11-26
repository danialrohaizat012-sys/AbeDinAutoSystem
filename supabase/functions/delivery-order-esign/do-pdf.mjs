export const DO_TERMS_VERSION=3;
export const DO_TERMS=Object.freeze({intro:"Dengan menandatangani borang ini, saya selaku pembeli mengakui bahawa:",clauses:Object.freeze(["Saya telah diberi peluang munasabah untuk memeriksa kenderaan dan bertanya tentang keadaannya sebelum menerima serahan.","Saya memahami kenderaan ini terpakai. Usia, perbatuan, harga dan keadaan sebenar diambil kira tanpa menjejaskan gerenti atau keperluan keselamatan di sisi undang-undang.","Kecacatan khusus yang dimaklumkan sebelum persetujuan pembelian direkodkan dalam catatan atau dokumen rujukan, jika ada. Ini bukan pengesahan bahawa tiada kecacatan tersembunyi.","Jaminan tambahan, jika ada, mengikut terma yang dipersetujui. Borang ini tidak membatalkan janji, representasi atau tanggungjawab Abe Din Auto di sisi undang-undang.","Selepas serahan, saya bertanggungjawab atas penyelenggaraan biasa dan kerosakan yang terbukti berpunca daripada salah penggunaan, kecuaian, kemalangan atau pengubahsuaian oleh saya, bukan liabiliti penjual.","Saya mengesahkan penerimaan kenderaan, kunci, dokumen dan aksesori setakat rekod yang tepat. Saya akan memaklumkan masalah dalam masa munasabah dan memberi peluang pemeriksaan jika sesuai, tanpa mengehadkan remedi saya.","Saya telah membaca, memahami dan berpeluang meminta penjelasan serta membetulkan rekod. Saya menandatangani secara sukarela, sama ada secara fizikal atau elektronik."]),rights:"Borang ini ialah bukti serahan, bukan pelepasan liabiliti menyeluruh. Hak pengguna, termasuk gerenti dan remedi di bawah Akta Perlindungan Pengguna 1999 (Akta 599), kekal terpelihara."});
// Internal delivery order: read-only, generated in the signed-in browser.
export function deliveryFields({x={},v={},c={}}={}){
  const note=String(c.notes||'');
  const ic=note.match(/(?:^|\n)\s*(?:No\.?\s*IC|No\.?\s*Kad Pengenalan)\s*:\s*([^\r\n]+)/i)?.[1]?.trim()||'';
  const address=note.match(/(?:^|\n)\s*Alamat\s*:\s*([^\r\n]+)/i)?.[1]?.trim()||'';
  return {no:'DO-'+String(x.id||'').replace(/-/g,'').toUpperCase(),name:c.full_name||'',ic:c.ic_no||ic,phone:c.phone||'',address:c.address||address,plate:v.plate||'',model:[v.make,v.model].filter(Boolean).join(' '),year:v.model_year||'',mileage:v.mileage_km??''};
}
export async function buildDeliveryOrderPdf(PDFLib,{x,v,c,handover={}}){
  const a={...deliveryFields({x,v,c}),...handover};
  const {PDFDocument,StandardFonts,rgb}=PDFLib;
  const doc=await PDFDocument.create(),page=doc.addPage([595.28,841.89]);
  const f=await doc.embedFont(StandardFonts.Helvetica),b=await doc.embedFont(StandardFonts.HelveticaBold);
  const W=595.28,H=841.89,M=34,R=W-M,mid=W/2+10;
  const ink=rgb(.13,.13,.13),mut=rgb(.34,.34,.34),line=rgb(.66,.66,.66),light=rgb(.90,.90,.90),white=rgb(1,1,1);
  const clean=t=>String(t??'').normalize('NFKC').replace(/[^\x20-\x7E\xA0-\xFF]/g,' ').replace(/\s+/g,' ').trim();
  const text=(value,x,y,size=9,font=f,color=ink,align='left')=>{const s=clean(value);const w=font.widthOfTextAtSize(s,size);page.drawText(s,{x:align==='right'?x-w:align==='center'?x-w/2:x,y:H-y,size,font,color});};
  const rect=(x,y,w,h,color)=>page.drawRectangle({x,y:H-y-h,width:w,height:h,color});
  const rule=(x,y,x2)=>page.drawLine({start:{x,y:H-y},end:{x:x2,y:H-y},thickness:.5,color:line});
  const bar=(label,y)=>{rect(M,y,R-M,19,light);text(label,M+9,y+13,9.5,b);};
  const wrap=(value,width,size,font)=>{let lines=[],s='';for(const ch of clean(value)){if(s&&font.widthOfTextAtSize(s+ch,size)>width){let at=s.lastIndexOf(' ');if(at>0){lines.push(s.slice(0,at));s=s.slice(at+1)}else{lines.push(s);s=''}}s+=ch}if(s)lines.push(s);return lines};
  const field=(label,value,x,y,end)=>{text(label,x,y,8,f,mut);const width=end-x;let size=10.2,lines=wrap(value,width,size,b);while(lines.length>2&&size>6){size-=.5;lines=wrap(value,width,size,b)}if(lines.length>2)throw new Error(label+' terlalu panjang. Ringkaskan sebelum mencetak.');lines.forEach((s,i)=>text(s,x,y+10+i*9,size,b));rule(x,y+22,end);};
  const left=M+9,right=mid,endL=mid-22,endR=R-9;
  const pair=(l,lv,r,rv,y)=>{field(l,lv,left,y,endL);field(r,rv,right,y,endR)};
  const check=(label,x,y,checked=false)=>{page.drawRectangle({x,y:H-y,width:7,height:7,borderColor:ink,borderWidth:.6});if(checked){page.drawLine({start:{x:x+1,y:H-y+3},end:{x:x+3,y:H-y+1},thickness:1,color:ink});page.drawLine({start:{x:x+3,y:H-y+1},end:{x:x+6,y:H-y+6},thickness:1,color:ink})}text(label,x+10,y-.5,8.4);};
  rect(M,22,R-M,58,ink);text('ABE DIN AUTO',M+13,42,20,b,white);text('JUAL  -  BELI  -  TUKAR BELI',M+13,55,9,b,white);
  text('926-D, Kg Kenali, Kubang Kerian, 16150 Kota Bharu, Kelantan',M+13,69,8,f,white);
  text('TEL: 011-56366925',R-12,46,8,f,white,'right');text('SSM: 003842956-V',R-12,60,8,f,white,'right');
  text('BORANG SERAHAN KENDERAAN / DELIVERY ORDER',W/2,98,14,b,ink,'center');
  let date='',day='';if(/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')){const dt=new Date(a.date+'T12:00:00+08:00');if(!isNaN(dt)){date=a.date.split('-').reverse().join('/');day=new Intl.DateTimeFormat('ms-MY',{weekday:'long',timeZone:'Asia/Kuala_Lumpur'}).format(dt)}}
  bar('A. MAKLUMAT SERAHAN',111);pair('Tarikh',date,'Hari',day,136);pair('Masa Serahan',a.time||'','No. DO',a.no,164);
  bar('B. MAKLUMAT PELANGGAN',191);pair('Nama Pelanggan',a.name,'No. Kad Pengenalan',a.ic,216);pair('No. Telefon',a.phone,'Alamat',a.address,244);
  bar('C. MAKLUMAT KENDERAAN',271);pair('No. Pendaftaran',a.plate,'Jenama / Model',a.model,296);
  const km=a.mileage!==''&&a.mileage!=null&&Number.isFinite(Number(a.mileage))?Number(a.mileage).toLocaleString('en-MY')+' km':'';
  pair('Tahun',a.year,'Mileage (KM)',km,324);
  bar('D. STATUS SERAHAN & DOKUMEN',351);
  text('Keadaan:',left,380,8.4);check('Baik',left+48,380,a.condition==='baik');check('Perlu Pemeriksaan',left+88,380,a.condition==='perlu');
  text('Bilangan Kunci:',right,380,8.4);check('1',right+78,380,a.keys==='1');check('2',right+105,380,a.keys==='2');
  text('Dokumen:',left,399,8.4);check('Geran/e-Geran',left+48,399,a.docs?.includes('geran'));check('Insurans',left+131,399,a.docs?.includes('insurans'));check('Lain-lain',left+189,399,a.docs?.includes('lain'));
  text('Barang / Aksesori:',right,399,8.4);rule(right+91,401,endR);if(a.accessories){const lines=wrap(a.accessories,endR-right-92,7,f);if(lines.length>1)throw Error('Aksesori terlalu panjang. Gunakan catatan.');text(lines[0],right+92,398,7);}
  bar('E. PENGAKUAN, PERSETUJUAN DAN PENERIMAAN KENDERAAN',413);
  let y=444;
  const size=9.2,leading=11;
  text(DO_TERMS.intro,left,y,size,b);y+=13;
  DO_TERMS.clauses.forEach((clause,i)=>{
    const lines=wrap(clause,endR-left-14,size,f);
    text(String(i+1)+'.',left,y,size,f);
    lines.forEach((s,j)=>text(s,left+14,y+j*leading,size,f));
    y+=lines.length*leading+2;
  });
  wrap(DO_TERMS.rights,endR-left,size,b).forEach(s=>{text(s,left,y,size,b);y+=leading});
  const fy=y+7,gy=fy+91;
  if(gy+54>H-20)throw Error('Terma DO melebihi ruang A4.');
  bar('F. PENGESAHAN SERAHAN',fy);
  text('PIHAK ABE DIN AUTO',(left+endL)/2,fy+30,10,b,ink,'center');text('PELANGGAN',(right+endR)/2,fy+30,10,b,ink,'center');
  const companyCenter=(left+endL)/2;
  text('CETAKAN BERKOMPUTER',companyCenter,fy+44,10,b,ink,'center');
  wrap('Dokumen ini dijana oleh sistem dan tidak memerlukan tandatangan pihak Abe Din Auto.',endL-left-16,9,f).forEach((s,i)=>text(s,companyCenter,fy+56+i*10,9,f,mut,'center'));
  if(a.signature){const sx=right+12,sy=fy+32,sw=endR-right-24,sh=32;for(const stroke of a.signature){for(let i=1;i<stroke.length;i++){const [x1,y1]=stroke[i-1],[x2,y2]=stroke[i];page.drawLine({start:{x:sx+x1*sw,y:H-sy-y1*sh},end:{x:sx+x2*sw,y:H-sy-y2*sh},thickness:1.15,color:rgb(.08,.15,.32)})}}const time=new Intl.DateTimeFormat('en-GB',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(a.signedAt));text('Ditandatangani: '+time+' MYT',right+10,fy+78,8.5)}else{rule(right+10,fy+66,endR-5);text('Nama / Tandatangan:',right+10,fy+78,8.5);}
  bar('G. CATATAN / RUJUKAN KECACATAN DIMAKLUMKAN SEBELUM PEMBELIAN',gy);
  const notes=wrap(a.notes||'',endR-left,9,f);if(notes.length>2)throw Error('Catatan terlalu panjang.');notes.forEach((s,i)=>text(s,left,gy+32+i*18,9));
  rule(left,gy+36,endR);rule(left,gy+54,endR);
  doc.setTitle('Borang Serahan Kenderaan '+a.no);doc.setAuthor('Abe Din Auto');
  const bytes=await doc.save();return {bytes,fname:'DO-'+clean(a.plate||'jualan').replace(/[^a-z0-9_-]/gi,'')+'-'+a.no.replace(/^DO-/,'')+'.pdf'};
}
