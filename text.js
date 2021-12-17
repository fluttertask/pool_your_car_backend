const d = new Date('Fri, 17 December 2021' + ' ' + '2:00 PM');
const n = new Date();

var last = (((((d.getFullYear() * 12) + d.getMonth()) * 30) + d.getDate()) * 24)+d.getHours();
var now = (((((n.getFullYear() * 12) + n.getMonth()) * 30) + n.getDate()) * 24)+n.getHours();
console.log(last - now);


