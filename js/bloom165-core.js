export const EVENT='yawarakana-release-20261122';
export const START=Date.parse('2026-11-18T00:00:00+09:00');
export const RELEASE=Date.parse('2026-11-22T00:00:00+09:00');
export const jstDay=ms=>new Date(ms+32400000).toISOString().slice(0,10);
export const receiptId=(uid,day)=>`omoi165_${day}_${uid}`;
export const tierFor=n=>n>=50?50:n>=30?30:n>=20?20:n>=10?10:0;
export function phaseAt(ms){return ms<START?'before':ms<RELEASE?'countdown':'released';}
export function remaining(ms){const minutes=Math.max(0,Math.ceil((RELEASE-ms)/60000));return {days:Math.floor(minutes/1440),hours:Math.floor(minutes%1440/60),minutes:minutes%60};}
export function validReceipt(id,v){return v?.event===EVENT&&typeof v.uid==='string'&&v.uid.length>0&&typeof v.date==='string'&&/^2026-11-(18|19|20|21)$/.test(v.date)&&id===receiptId(v.uid,v.date);}
export function summarize(rows,uid,day){let total=0,mine=false;for(const row of rows)if(validReceipt(row.id,row.data)){total++;if(row.data.uid===uid&&row.data.date===day)mine=true;}return {total,mine};}
