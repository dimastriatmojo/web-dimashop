const KEY_PRODUCTS="guruna_products_v1";
const KEY_CART="guruna_cart_v1";
const KEY_ORDERS="guruna_orders_v1";

const seedProducts=[
 {id:"p1",name:"Nasi Goreng Spesial",price:18000,stock:20,category:"Makanan",image:"",description:"Nasi goreng spesial dengan telur dan topping pilihan.",created:Date.now()-5000},
 {id:"p2",name:"Mie Goreng Special",price:15000,stock:25,category:"Makanan",image:"",description:"Mie goreng gurih dengan topping lengkap.",created:Date.now()-4000},
 {id:"p3",name:"Ayam Geprek",price:20000,stock:18,category:"Makanan",image:"",description:"Ayam crispy dengan sambal pedas.",created:Date.now()-3000},
 {id:"p4",name:"Es Teh Manis",price:5000,stock:30,category:"Minuman",image:"",description:"Minuman teh manis dingin yang menyegarkan.",created:Date.now()-2000},
 {id:"p5",name:"Jus Jeruk",price:10000,stock:20,category:"Minuman",image:"",description:"Jus jeruk segar dan dingin.",created:Date.now()-1000},
 {id:"p6",name:"Paket Hemat Dima",price:30000,stock:15,category:"Makanan",image:"",description:"Paket hemat makanan dan minuman.",created:Date.now()}
];

let products=load(KEY_PRODUCTS,seedProducts);
let cart=load(KEY_CART,[]);
let orders=load(KEY_ORDERS,[]);

function load(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key));
    return value ?? structuredClone(fallback);
  }catch(e){ return structuredClone(fallback); }
}
function save(key,value){localStorage.setItem(key,JSON.stringify(value));}
function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);}
function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),2200);}

function renderProducts(){
  const grid=document.getElementById("productGrid"), empty=document.getElementById("emptyProducts");
  const search=document.getElementById("searchInput").value.trim().toLowerCase();
  const sort=document.getElementById("sortSelect").value;
  const categories=[...document.querySelectorAll('input[name="category"]:checked')].map(x=>x.value);
  let list=products.filter(p=>{
    const text=(p.name+" "+p.category+" "+(p.description||"")).toLowerCase();
    return (!search||text.includes(search))
      && (!categories.length||categories.includes(p.category));
  });
  if(sort==="low")list.sort((a,b)=>a.price-b.price);
  if(sort==="high")list.sort((a,b)=>b.price-a.price);
  if(sort==="newest")list.sort((a,b)=>b.created-a.created);
  empty.classList.toggle("hidden",list.length>0);
  grid.innerHTML=list.map(productCard).join("");
}
function productCard(p){
  const img=p.image?`<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`:"";
  return `<article class="product">
    <div class="product-image">${img}<span class="placeholder" style="${p.image?"display:none":""}">🛍️</span><span class="stock-badge">${p.stock>0?"Stok "+p.stock:"Habis"}</span></div>
    <div class="product-body">
      <h3>${escapeHTML(p.name)}</h3>
      <div class="product-price">${rupiah(p.price)}</div>
      <div class="product-meta">${escapeHTML(p.category)}</div>
      <button ${p.stock<1?"disabled":""} onclick="addToCart('${p.id}')">${p.stock<1?"Stok Habis":"Tambah ke Keranjang"}</button>
    </div>
  </article>`;
}
function addToCart(id){
  const p=products.find(x=>x.id===id); if(!p||p.stock<1)return;
  const item=cart.find(x=>x.id===id);
  if(item){if(item.qty>=p.stock){toast("Jumlah melebihi stok");return}item.qty++}
  else cart.push({id,qty:1});
  save(KEY_CART,cart);renderCart();toast("Produk masuk ke keranjang");
}
function renderCart(){
  const box=document.getElementById("cartItems");
  let total=0,count=0;
  box.innerHTML=cart.length?cart.map(item=>{
    const p=products.find(x=>x.id===item.id);
    if(!p)return "";
    total+=p.price*item.qty;count+=item.qty;
    return `<div class="cart-item">
      <div class="cart-item-img">${p.image?`<img src="${escapeHTML(p.image)}" style="width:100%;height:100%;object-fit:cover" alt="">`:"🛍️"}</div>
      <div><h4>${escapeHTML(p.name)}</h4><p>${rupiah(p.price)}</p>
      <div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><b>${item.qty}</b><button onclick="changeQty('${p.id}',1)">+</button></div></div>
      <button class="remove" onclick="removeCart('${p.id}')">Hapus</button>
    </div>`;
  }).join(""):`<div class="empty" style="margin-top:20px">Keranjang masih kosong.</div>`;
  document.getElementById("cartSubtotal").textContent=rupiah(total);
  document.getElementById("cartCount").textContent=count;
  document.getElementById("checkoutTotal").textContent=rupiah(total);
  document.getElementById("checkoutBtn").disabled=!cart.length;
}
function changeQty(id,d){
  const item=cart.find(x=>x.id===id),p=products.find(x=>x.id===id);if(!item||!p)return;
  item.qty+=d;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  else if(item.qty>p.stock){item.qty=p.stock;toast("Jumlah maksimal sesuai stok");}
  save(KEY_CART,cart);renderCart();
}
function removeCart(id){cart=cart.filter(x=>x.id!==id);save(KEY_CART,cart);renderCart();}
function openCart(){document.getElementById("cartDrawer").classList.add("open");document.getElementById("cartOverlay").classList.remove("hidden")}
function closeCart(){document.getElementById("cartDrawer").classList.remove("open");document.getElementById("cartOverlay").classList.add("hidden")}
function openCheckout(){
  if(!cart.length){toast("Keranjang masih kosong");return}
  closeCart();document.getElementById("checkoutModal").classList.remove("hidden");
}
function closeCheckout(){document.getElementById("checkoutModal").classList.add("hidden")}

function submitOrder(e){
  e.preventDefault();
  if(!cart.length)return;
  const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);return {id:p.id,name:p.name,price:p.price,qty:i.qty}});
  const total=items.reduce((s,x)=>s+x.price*x.qty,0);
  const order={
    id:"ORD-"+Date.now().toString(36).toUpperCase(),
    date:new Date().toISOString(),
    status:"Pesanan dibuat",
    buyer:{
      name:buyerName.value.trim(),phone:buyerPhone.value.trim(),address:buyerAddress.value.trim(),
      city:buyerCity.value.trim(),postal:buyerPostal.value.trim()
    },
    payment:paymentMethod.value,items,total
  };
  orders.unshift(order);save(KEY_ORDERS,orders);
  items.forEach(i=>{const p=products.find(x=>x.id===i.id);if(p)p.stock=Math.max(0,p.stock-i.qty)});
  save(KEY_PRODUCTS,products);
  cart=[];save(KEY_CART,cart);renderProducts();renderCart();closeCheckout();document.getElementById("checkoutForm").reset();
  showPage("orders");toast("Pesanan berhasil dibuat");
}
function renderOrders(){
  const box=document.getElementById("ordersList");
  if(!orders.length){box.innerHTML='<div class="empty">Belum ada pesanan. Silakan belanja terlebih dahulu.</div>';return}
  box.innerHTML=orders.map(o=>`<div class="order-card">
    <div class="order-head"><div><strong>${escapeHTML(o.id)}</strong><div style="font-size:11px;color:#7b8491;margin-top:4px">${new Date(o.date).toLocaleString("id-ID")}</div></div><span class="status">${escapeHTML(o.status)}</span></div>
    <div style="padding:10px 0;font-size:12px;color:#667080"><b>Pengiriman:</b> ${escapeHTML(o.buyer.name)} · ${escapeHTML(o.buyer.phone)}<br>${escapeHTML(o.buyer.address)}, ${escapeHTML(o.buyer.city)} ${escapeHTML(o.buyer.postal)}<br><b>Pembayaran:</b> ${escapeHTML(o.payment)}</div>
    ${o.items.map(i=>`<div class="order-item"><span>${escapeHTML(i.name)} × ${i.qty}</span><b>${rupiah(i.price*i.qty)}</b></div>`).join("")}
    <div class="order-total">Total: ${rupiah(o.total)}</div>
  </div>`).join("");
}

function renderAdmin(){
  const box=document.getElementById("adminProducts");
  box.innerHTML=products.map(p=>`<div class="admin-product">
    ${p.image?`<img class="admin-thumb" src="${escapeHTML(p.image)}" alt="">`:`<div class="admin-thumb" style="display:grid;place-items:center">🛍️</div>`}
    <div class="admin-product-info"><strong>${escapeHTML(p.name)}</strong><small>${rupiah(p.price)} · stok ${p.stock}</small></div>
    <button class="delete-btn" onclick="deleteProduct('${p.id}')">Hapus</button>
  </div>`).join("");
}
function deleteProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!confirm(`Hapus produk "${p.name}"?`))return;
  products=products.filter(x=>x.id!==id);
  cart=cart.filter(x=>x.id!==id);
  save(KEY_PRODUCTS,products);save(KEY_CART,cart);renderProducts();renderCart();renderAdmin();toast("Produk dihapus");
}
async function postProduct(e){
  e.preventDefault();
  try {
  const file=document.getElementById("pFile").files[0];
  let image="";
  if(file){
    if(file.size>1500000){toast("Ukuran gambar maksimal 1,5 MB");return}
    image=await fileToDataURL(file);
  }

  const p={
    id:"p-"+Date.now(),
    name:document.getElementById("pName").value.trim(),
    price:Number(document.getElementById("pPrice").value),
    stock:Number(document.getElementById("pStock").value),
    category:document.getElementById("pCategory").value,
    image,
    description:document.getElementById("pDescription").value.trim(),
    created:Date.now()
  };
  if(!p.name||p.price<0||p.stock<0){toast("Lengkapi nama, harga, dan stok menu");return}
  products.unshift(p);save(KEY_PRODUCTS,products);renderProducts();renderAdmin();e.target.reset();
  document.getElementById("pStock").value=10;
  toast("Produk berhasil diposting");
  } catch(error) {
    console.error("Gagal posting produk:", error);
    toast("Gagal posting produk. Periksa data yang diisi.");
  }
}
function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}

function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));
  document.getElementById(page+"Page").classList.add("active-page");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  if(page==="orders")renderOrders();
  if(page==="admin")renderAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.getElementById("ordersBtn").onclick=()=>showPage("orders");
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
document.getElementById("cartOverlay").onclick=closeCart;
document.getElementById("checkoutBtn").onclick=openCheckout;
document.getElementById("closeCheckout").onclick=closeCheckout;
document.getElementById("checkoutForm").addEventListener("submit",submitOrder);
document.getElementById("productForm").addEventListener("submit",postProduct);
document.getElementById("searchInput").addEventListener("input",renderProducts);
document.getElementById("sortSelect").addEventListener("change",renderProducts);
document.getElementById("shopNow").onclick=()=>document.getElementById("productsSection").scrollIntoView({behavior:"smooth"});
document.getElementById("clearFilters").onclick=()=>{
  document.querySelectorAll('input[name="category"]').forEach(x=>x.checked=false);
renderProducts();
};
document.querySelectorAll('input[name="category"]').forEach(x=>x.addEventListener("change",renderProducts));



renderProducts();renderCart();
