// Internal delivery order: read-only, generated in the signed-in browser.
export function deliveryFields({x={},v={},c={}}={}){
  const d=v.details||{};
  const note=String(c.notes||'');
  const ic=note.match(/(?:^|\n)\s*(?:No\.?\s*IC|No\.?\s*Kad Pengenalan)\s*:\s*([^\r\n]+)/i)?.[1]?.trim()||'';
  const address=note.match(/(?:^|\n)\s*Alamat\s*:\s*([^\r\n]+)/i)?.[1]?.trim()||'';
  return {no:'DO-'+String(x.id||'').replace(/-/g,'').toUpperCase(),name:c.full_name||'',ic:c.ic_no||ic,phone:c.phone||'',address:c.address||address,plate:v.plate||'',model:[v.make,v.model].filter(Boolean).join(' '),variant:d.variant||[d.engine_cc?d.engine_cc+' cc':'',d.transmission].filter(Boolean).join(' / '),year:v.model_year||'',color:d.color||'',vin:d.chassis_no||'',engine:d.engine_no||'',mileage:v.mileage_km??''};
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
  const check=(label,x,y)=>{page.drawRectangle({x,y:H-y,width:7,height:7,borderColor:ink,borderWidth:.6});text(label,x+10,y-.5,8.4);};
  rect(M,30,R-M,65,ink);text('ABE DIN AUTO',M+13,50,20,b,white);text('JUAL  -  BELI  -  TUKAR BELI',M+13,65,9,b,white);
  text('926-D, Kg Kenali, Kubang Kerian, 16150 Kota Bharu, Kelantan',M+13,81,8,f,white);
  text('TEL: 011-56366925',R-12,56,8,f,white,'right');text('SSM: 003842956-V',R-12,72,8,f,white,'right');
  text('BORANG SERAHAN KENDERAAN / DELIVERY ORDER',W/2,116,14,b,ink,'center');
  let date='',day='';if(/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')){const dt=new Date(a.date+'T12:00:00+08:00');if(!isNaN(dt)){date=a.date.split('-').reverse().join('/');day=new Intl.DateTimeFormat('ms-MY',{weekday:'long',timeZone:'Asia/Kuala_Lumpur'}).format(dt)}}
  bar('A. MAKLUMAT SERAHAN',143);pair('Tarikh',date,'Hari',day,176);pair('Masa Serahan',a.time||'','No. DO',a.no,209);
  bar('B. MAKLUMAT PELANGGAN',237);pair('Nama Pelanggan',a.name,'No. Kad Pengenalan',a.ic,270);pair('No. Telefon',a.phone,'Alamat',a.address,303);
  bar('C. MAKLUMAT KENDERAAN',330);pair('No. Pendaftaran',a.plate,'Jenama / Model',a.model,363);pair('Varian / Spesifikasi',a.variant,'Tahun',a.year,396);pair('Warna',a.color,'No. Chassis / VIN',a.vin,429);
  const km=a.mileage!==''&&a.mileage!=null&&Number.isFinite(Number(a.mileage))?Number(a.mileage).toLocaleString('en-MY')+' km':'';
  pair('No. Enjin',a.engine,'Mileage (KM)',km,462);
  bar('D. STATUS SERAHAN & DOKUMEN',489);
  text('Keadaan:',left,523,8.4);check('Baik',left+48,523);check('Perlu Pemeriksaan',left+88,523);
  text('Bilangan Kunci:',right,523,8.4);check('1',right+78,523);check('2',right+105,523);
  text('Dokumen:',left,546,8.4);check('Geran/e-Geran',left+48,546);check('Insurans',left+131,546);check('Lain-lain',left+189,546);
  text('Barang / Aksesori:',right,546,8.4);rule(right+91,548,endR);
  bar('E. PENGAKUAN PELANGGAN',562);
  const statement='Saya mengesahkan bahawa kenderaan di atas telah diserahkan kepada saya dalam keadaan seperti yang dinyatakan dan saya telah menerima kenderaan serta dokumen/barang yang berkaitan. Sebarang perkara tambahan dinyatakan di bahagian catatan.';
  wrap(statement,endR-left,9,f).forEach((s,i)=>text(s,left,595+i*12,9));
  bar('F. PENGESAHAN SERAHAN',632);
  text('PIHAK ABE DIN AUTO',(left+endL)/2,667,10,b,ink,'center');text('PELANGGAN',(right+endR)/2,667,10,b,ink,'center');
  rule(left+10,719,endL-5);rule(right+10,719,endR-5);
  text('Nama / Tandatangan:',left+10,732,8.5);text('Nama / Tandatangan:',right+10,732,8.5);
  bar('G. CATATAN',747);rule(left,786,endR);rule(left,808,endR);
  doc.setTitle('Borang Serahan Kenderaan '+a.no);doc.setAuthor('Abe Din Auto');
  const bytes=await doc.save();return {bytes,fname:'DO-'+clean(a.plate||'jualan').replace(/[^a-z0-9_-]/gi,'')+'-'+a.no.replace(/^DO-/,'')+'.pdf'};
}
