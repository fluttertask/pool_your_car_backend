const d = new Date('26 November 2021' + ' ' + '6:00 PM');
const n = new Date();

var last = ((((d.getFullYear() * 12) + d.getMonth()) * 30) + d.getDate()) * 24;
var now = ((((n.getFullYear() * 12) + n.getMonth()) * 30) + n.getDate()) * 24;