// V83 regression checks for the inline Cloud sales report.
// Run: node --test tests/v83-sales-report.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf8');
const start = html.indexOf("let reportYear=String(new Date().getFullYear())");
const end = html.indexOf("function renderCloud()", start);
assert.ok(start > 0 && end > start, 'Cloud report source is present');
const reportCode = html.slice(start, end);
function harness({sales, payments = [], vehicles = [], overrides = {}}) {
  const context = {
    sales, payments, vehicles, money: n => 'RM ' + Number(n).toFixed(2),
    safe: x => String(x ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;'),
    el: () => null, ...overrides
  };
  vm.createContext(context);
  vm.runInContext(reportCode, context);
  vm.runInContext("reportYear='2026';reportMonth='11';reportScale='daily';reportDay=''", context);
  return {
    html: (state='sold') => vm.runInContext("reportStatus="+JSON.stringify(state)+";salesReportCloud()", context)
  };
}
const vehicles = [{id:'v1',make:'Toyota',model:'Vios',plate:'ABC123'}];
const sales = [
  {id:'s1',vehicle_id:'v1',status:'sold',agreed_price:25000,created_at:'2026-10-01T02:00:00Z',sold_at:'2026-11-15T02:00:00Z'},
  {id:'s2',vehicle_id:'v1',status:'reserved',agreed_price:12000,created_at:'2026-11-12T02:00:00Z'},
  {id:'s3',vehicle_id:'v1',status:'cancelled',agreed_price:100000,created_at:'2026-11-14T02:00:00Z'},
  {id:'s4',vehicle_id:'v1',status:'void',agreed_price:80000,created_at:'2026-11-14T02:00:00Z'}
];
const payments = [{sale_id:'s1',amount:5000},{sale_id:'s1',amount:20000},{sale_id:'s2',amount:1000},{sale_id:'s3',amount:100000}];
test('completed sales view defaults to Sold and uses sold_at', () => {
  const page=harness({sales,payments,vehicles}).html();
  assert.match(page,/Jualan selesai/);
  assert.match(page,/RM 25000\.00/);
  assert.match(page,/2026-11-15/);
  assert.doesNotMatch(page,/RM 100000\.00/);
  assert.doesNotMatch(page,/RM 80000\.00/);
  assert.doesNotMatch(page,/RM 12000\.00/);
});
test('all active view includes reserved but excludes cancelled and void', () => {
  const page=harness({sales,payments,vehicles}).html('all');
  assert.match(page,/RM 25000\.00/);
  assert.match(page,/RM 12000\.00/);
  assert.doesNotMatch(page,/RM 100000\.00/);
  assert.doesNotMatch(page,/RM 80000\.00/);
});
test('report status filter is wired to view state', () => {
  assert.match(reportCode,/id="ada-r-status"/);
  assert.match(reportCode,/reportStatus=v/);
});
