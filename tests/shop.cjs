const vm=require('vm'),fs=require('fs'),assert=require('assert');
const elements=new Map(),events={};
function el(sel){if(!elements.has(sel))elements.set(sel,{innerHTML:'',textContent:'',value:'',disabled:false,open:false,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},showModal(){this.open=true},close(){this.open=false},addEventListener(){}});return elements.get(sel);}
const memory={};const context=vm.createContext({console,document:{querySelector:el,querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f,createElement:()=>({click(){}})},localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},setTimeout:()=>0,clearTimeout(){},location:{hash:''},confirm:()=>true,FormData:class{constructor(f){this.data=f.data}entries(){return Object.entries(this.data)}},Blob,URL,Date,Math});
vm.runInContext(fs.readFileSync('app.js','utf8'),context);
const run=s=>vm.runInContext(s,context),click=(id,dataset={})=>events.click({target:{closest:()=>({id,dataset,hasAttribute:()=>false})}});
run("custom('tote');current.color='forest';current.logo='<script>alert(1)</script>';current.qty=100;updateCustom();addCart()");
assert.equal(run('state.cart[0].qty'),100);assert.equal(run('total()'),59000);assert.equal(run('used()'),20);assert(!el('#previewBag').innerHTML.includes('<script>'));assert(el('#previewBag').innerHTML.includes('&lt;script&gt;'));
run("custom('tote');current.qty=1000;updateCustom()");assert.equal(el('#addToCart').disabled,true);
run("custom('mini');current.qty=50;addCart()");assert.equal(run('total()'),73500);assert.equal(run('used()'),24);
click('checkoutBtn');assert(el('#checkoutBody').innerHTML.includes('checkoutForm'));
const form={reportValidity:()=>true,data:{name:'ทดลอง <img>',company:'องค์กร',email:'demo@example.com',phone:'0800000000',address:'99 ถนนตัวอย่าง กรุงเทพฯ',consent:'on'}};context.testForm=form;run('submitOrder(testForm)');assert.equal(run('state.orders.length'),1);assert.equal(run('state.cart.length'),0);assert.equal(run('state.orders[0].total'),73500);assert(el('#checkoutBody').innerHTML.includes('ทดลอง &lt;img&gt;'));const orderId=run('state.orders[0].id');click('viewMyOrders');assert(el('#ordersBody').innerHTML.includes('5</strong>'));
click('',{produce:orderId});assert.equal(run('state.orders[0].status'),'production');click('',{deliver:orderId});assert.equal(run('state.orders[0].status'),'delivered');assert(el('#ordersBody').innerHTML.includes('29</strong>'));click('',{deliver:orderId});assert(el('#ordersBody').innerHTML.includes('29</strong>'));
assert.equal(JSON.parse(memory['reform-shop-v1']).orders[0].status,'delivered');
click('',{reorder:orderId});assert.equal(run('state.cart.length'),2);assert.equal(run('total()'),73500);click('',{remove:'0'});assert.equal(run('total()'),14500);
run("custom('mini',0);current.qty=60;addCart()");assert.equal(run('total()'),17400);
run('state.cart=[];renderCart()');assert(el('#cartBody').innerHTML.includes('ยังไม่มีสินค้า'));
console.log('PASS: customization, price, stock limit, cart/edit/remove, checkout, escaped input, order persistence, production/delivery, points once, reorder, empty cart');
