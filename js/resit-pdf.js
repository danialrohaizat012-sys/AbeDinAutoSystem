// Abe Din Auto — penjana PDF Resit Bayaran jualan kereta (dikongsi: sistem admin & halaman awam resit.html).
const dmy=d=>{if(!d)return '-';const x=new Date(d);return isNaN(x)?'-':x.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'})};
const rm2=v=>'RM '+Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const saleStatusLabel=s=>({reserved:'Reserved',sold:'Sold',completed:'Selesai',active:'Aktif',cancelled:'Dibatalkan'}[String(s||'').toLowerCase()]||String(s||'-'));
const saleKindLabel=k=>({deposit:'Deposit',full_payment:'Bayaran Penuh'}[k]||String(k||'Bayaran'));
const payMethodOf=p=>{const m=String(p?.notes||'').match(/^\[Kaedah:\s*([^\]]+)\]/);return m?m[1].trim():''};
const payNoteOf=p=>String(p?.notes||'').replace(/^\[Kaedah:\s*[^\]]+\]\s*/,'').trim();
export function receiptNo(x){return 'ADA-'+String(x?.id||'').replace(/-/g,'').slice(0,8).toUpperCase()}
export async function buildSaleReceiptPdf(PDFLib,{x,v={},c={},pays=[]}){
    const {PDFDocument,StandardFonts,rgb}=PDFLib;
    pays=[...pays].sort((a,b)=>String(a.confirmed_at||'').localeCompare(String(b.confirmed_at||'')));
    const paid=pays.reduce((a,p)=>a+Number(p.amount||0),0),bal=Math.max(0,Number(x.agreed_price||0)-paid);
    const clean=t=>String(t??'').replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…]/g,'').trim();
    const doc=await PDFDocument.create();const page=doc.addPage([595.28,841.89]);const W=595.28,H=841.89,M=40;
    const f=await doc.embedFont(StandardFonts.Helvetica),fb=await doc.embedFont(StandardFonts.HelveticaBold);
    const ink=rgb(0.07,0.08,0.09),mut=rgb(0.37,0.4,0.44),y=rgb(0.957,0.769,0.188),line=rgb(0.88,0.89,0.91),soft=rgb(0.973,0.976,0.98);
    const txt=(t,x0,y0,o={})=>{let s=clean(t);const font=o.bold?fb:f,size=o.size||10;if(o.max){while(s.length>1&&font.widthOfTextAtSize(s,size)>o.max)s=s.slice(0,-2)+'…'}const w=font.widthOfTextAtSize(s,size);page.drawText(s,{x:o.right?x0-w:o.center?x0-w/2:x0,y:y0,size,font,color:o.color||ink});return w};
    // Kepala
    page.drawRectangle({x:0,y:H-118,width:W,height:118,color:ink});page.drawRectangle({x:0,y:H-122,width:W,height:4,color:y});
    let lx=M;try{const bytes=await (await fetch('/assets/embedded-300045c966fa.png')).arrayBuffer();const img=await doc.embedPng(bytes);const sc=56/img.height;page.drawImage(img,{x:M,y:H-90,width:img.width*sc,height:56});lx=M+img.width*sc+14}catch(_){}
    txt('ABE DIN AUTO',lx,H-44,{bold:true,size:17,color:rgb(1,1,1)});
    txt('202603102643 (003842956-V)',lx,H-59,{size:8.5,color:rgb(0.75,0.77,0.8)});
    txt('926-D, Kg Kenali, Kubang Kerian, 16150 Kota Bharu, Kelantan',lx,H-73,{size:8.5,color:rgb(0.75,0.77,0.8),max:W-lx-170});
    txt('Tel / WhatsApp: 011-5636 6925',lx,H-86,{size:8.5,color:rgb(0.75,0.77,0.8)});
    const no='ADA-'+String(x.id||'').replace(/-/g,'').slice(0,8).toUpperCase();
    txt('RESIT BAYARAN',W-M,H-46,{bold:true,size:15,color:y,right:true});
    txt('No. Resit: '+no,W-M,H-62,{size:9,color:rgb(1,1,1),right:true});
    txt('Tarikh: '+dmy(new Date()),W-M,H-75,{size:9,color:rgb(1,1,1),right:true});
    txt('Status: '+saleStatusLabel(bal<=0&&paid>0?'sold':x.status),W-M,H-88,{size:9,color:rgb(1,1,1),right:true});
    // Kotak maklumat
    let top=H-150;const colW=(W-2*M-16)/2;
    const box=(x0,title,rows)=>{const h=22+4*17+8;page.drawRectangle({x:x0,y:top-h,width:colW,height:h,color:soft,borderColor:line,borderWidth:1});txt(title.toUpperCase(),x0+12,top-16,{bold:true,size:8.5,color:mut});rows.forEach(([k,val],i)=>{const yy=top-36-i*17;txt(k,x0+12,yy,{size:9,color:mut});txt(val||'-',x0+92,yy,{size:9.5,bold:true,max:colW-104})});return h};
    const h1=box(M,'Maklumat Pelanggan',[['Nama',c.full_name],['Telefon',c.phone],['Email',c.email]]);
    const h2=box(M+colW+16,'Maklumat Kenderaan',[['Kenderaan',[v.model_year,v.make,v.model].filter(Boolean).join(' ')],['No. Plat',v.plate],['ID Kenderaan',v.vehicle_id],['Mileage',v.mileage_km?Number(v.mileage_km).toLocaleString('en-MY')+' km':'-']]);
    top-=Math.max(h1,h2)+22;
    // Butiran jualan
    txt('BUTIRAN JUALAN',M,top,{bold:true,size:10});top-=8;page.drawRectangle({x:M,y:top,width:W-2*M,height:1,color:line});top-=18;
    [['Harga dipersetujui',rm2(x.agreed_price)],['Tarikh jualan',dmy(x.created_at)],...(x.sold_at?[['Tarikh selesai',dmy(x.sold_at)]]:[])].forEach(([k,val])=>{txt(k,M,top,{size:10,color:mut});txt(val,W-M,top,{size:10,bold:true,right:true});top-=17});
    top-=10;
    // Jadual bayaran
    txt('REKOD PEMBAYARAN',M,top,{bold:true,size:10});top-=10;
    const cols=[M,M+78,M+168,M+278,W-M];
    page.drawRectangle({x:M,y:top-20,width:W-2*M,height:20,color:ink});
    [['Tarikh',cols[0]+10],['Jenis',cols[1]+10],['Kaedah',cols[2]+10],['No. Rujukan',cols[3]+10]].forEach(([t,xx])=>txt(t,xx,top-14,{bold:true,size:9,color:rgb(1,1,1)}));txt('Jumlah',cols[4]-10,top-14,{bold:true,size:9,color:rgb(1,1,1),right:true});
    top-=20;
    if(!pays.length){page.drawRectangle({x:M,y:top-22,width:W-2*M,height:22,color:soft});txt('Belum ada pembayaran direkodkan.',M+10,top-15,{size:9.5,color:mut});top-=22}
    const RH=19,maxRows=Math.max(2,Math.floor((top-345)/RH)),shown=pays.length>maxRows?pays.slice(0,maxRows-1):pays;shown.forEach((p,i)=>{if(i%2===0)page.drawRectangle({x:M,y:top-RH,width:W-2*M,height:RH,color:soft});txt(dmy(p.confirmed_at),cols[0]+10,top-13,{size:9});txt(saleKindLabel(p.kind),cols[1]+10,top-13,{size:9});txt(payMethodOf(p)||'-',cols[2]+10,top-13,{size:9,max:cols[3]-cols[2]-16});txt(p.reference_no||'-',cols[3]+10,top-13,{size:9,max:cols[4]-cols[3]-100});txt(rm2(p.amount),cols[4]-10,top-13,{size:9,bold:true,right:true});top-=RH});
    if(pays.length>shown.length){txt(`+ ${pays.length-shown.length} bayaran lagi (jumlah termasuk dalam ringkasan)`,M+10,top-14,{size:8.5,color:mut});top-=20}
    page.drawRectangle({x:M,y:top,width:W-2*M,height:1,color:line});
    // Ringkasan
    top-=16;const sx=W-M-220;
    page.drawRectangle({x:sx,y:top-72,width:220,height:72,color:soft,borderColor:line,borderWidth:1});
    const bw=sx-M-16;page.drawRectangle({x:M,y:top-72,width:bw,height:72,color:rgb(1,1,1),borderColor:y,borderWidth:1.2});
    txt('BAYARAN KE AKAUN ABE DIN AUTO',M+12,top-16,{bold:true,size:8.5,color:mut});
    txt('OCBC Bank',M+12,top-33,{bold:true,size:11});
    txt('7551072447',M+12,top-50,{bold:true,size:14});
    txt('Sila guna no. plat kenderaan sebagai rujukan bayaran',M+12,top-64,{size:7.5,color:mut,max:bw-24});
    txt('Harga',sx+12,top-18,{size:9.5,color:mut});txt(rm2(x.agreed_price),W-M-12,top-18,{size:9.5,right:true});
    txt('Jumlah dibayar',sx+12,top-36,{size:9.5,color:mut});txt(rm2(paid),W-M-12,top-36,{size:9.5,right:true,bold:true});
    page.drawRectangle({x:sx,y:top-72,width:220,height:24,color:bal>0?y:rgb(0.86,0.96,0.89)});
    txt(bal>0?'BAKI PERLU DIBAYAR':'LUNAS SEPENUHNYA',sx+12,top-64,{size:9.5,bold:true});txt(rm2(bal),W-M-12,top-64,{size:10.5,bold:true,right:true});
    // Terma & syarat
    let ty=top-96;
    txt('TERMA & SYARAT',M,ty,{bold:true,size:9.5});ty-=6;page.drawRectangle({x:M,y:ty,width:W-2*M,height:1,color:line});ty-=14;
    const wrap=(t,max,size)=>{const words=clean(t).split(' '),out=[];let cur='';words.forEach(w=>{const n=cur?cur+' '+w:w;if(f.widthOfTextAtSize(n,size)>max&&cur){out.push(cur);cur=w}else cur=n});if(cur)out.push(cur);return out};
    ['Setiap belian kenderaan adalah TANPA JAMINAN (warranty).','Pembeli wajib memeriksa kenderaan dengan teliti sebelum mengambil kenderaan.','Dengan mengambil kenderaan, pembeli mengesahkan kenderaan berada dalam keadaan baik dan diterima seperti yang telah dipersetujui oleh kedua-dua pihak.'].forEach((t,i)=>{txt((i+1)+'.',M,ty,{size:8.5,bold:true});wrap(t,W-2*M-16,8.5).forEach((ln,j)=>{txt(ln,M+14,ty,{size:8.5,color:rgb(0.2,0.22,0.25)});ty-=12});ty-=2});
    // Kotak nota
    const ny=96,nh=Math.max(62,Math.min(110,ty-ny-10));
    page.drawRectangle({x:M,y:ny,width:W-2*M,height:nh,borderColor:rgb(0.75,0.77,0.8),borderWidth:1,color:rgb(1,1,1)});
    txt('NOTA / CATATAN',M+10,ny+nh-14,{bold:true,size:8.5,color:mut});
    const notes=pays.map(p=>clean(payNoteOf(p))).filter(Boolean);
    let nyy=ny+nh-28;
    if(notes.length){notes.forEach(n=>wrap(n,W-2*M-20,8.5).forEach(ln=>{if(nyy>ny+6){txt(ln,M+10,nyy,{size:8.5});nyy-=11}}))}
    else{for(let k=ny+nh-34;k>ny+8;k-=16)page.drawRectangle({x:M+10,y:k,width:W-2*M-20,height:0.5,color:line})}
    // Tandatangan
    const sy=62;
    {const sw=220,sx=W-M-sw;page.drawRectangle({x:sx,y:sy,width:sw,height:0.8,color:mut});txt('Tandatangan Pelanggan',sx,sy-12,{size:8,bold:true,color:mut});txt(clean(c.full_name||''),sx,sy-23,{size:8,color:mut,max:sw});txt('Tarikh: '+dmy(x.created_at),M,sy-12,{size:8,bold:true,color:mut})}
    txt('Resit ini dijana oleh sistem Abe Din Auto. Terima kasih kerana memilih Abe Din Auto.',W/2,22,{size:8,color:mut,center:true});
    page.drawRectangle({x:0,y:0,width:W,height:6,color:y});
    doc.setTitle('Resit '+no);doc.setAuthor('Abe Din Auto');doc.setCreator('Abe Din Auto Management System');
    const bytes=await doc.save();
    const fname=`Resit-${clean(v.plate||v.vehicle_id||'jualan').replace(/\s+/g,'')}-${no}.pdf`;
    return {bytes,fname,no,paid,bal};
}
