(function(root){
  function pad(v){return String(v).padStart(2,'0')}
  function asDate(d){const v=d instanceof Date?new Date(d.getTime()):new Date(d);if(Number.isNaN(v.getTime()))throw new TypeError('Invalid date');return v}
  function localDateKey(d){const v=asDate(d);return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`}
  function dateFromKey(k){if(!/^\d{4}-\d{2}-\d{2}$/.test(k))throw new TypeError('Invalid date key');const [y,m,d]=k.split('-').map(Number),v=new Date(y,m-1,d);if(v.getFullYear()!==y||v.getMonth()!==m-1||v.getDate()!==d)throw new TypeError('Invalid date key');return v}
  function daysInMonth(y,m){
    if(!Number.isInteger(y)||!Number.isInteger(m))throw new TypeError('Invalid calendar month');
    return new Date(y,m+1,0).getDate();
  }
  // Return a date in the requested month without overflowing short months.
  // Month is zero-based, matching Date#setMonth and the rest of the calendar UI.
  function shiftMonth(y,m,d){
    if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isFinite(Number(d)))throw new TypeError('Invalid calendar date');
    const safeDay=Math.max(1,Math.trunc(Number(d)));
    const lastDay=daysInMonth(y,m);
    return new Date(y,m,Math.min(safeDay,lastDay));
  }
  const api={localDateKey,dateFromKey,daysInMonth,shiftMonth};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.OmniDate=api
})(typeof window==='undefined'?globalThis:window);
