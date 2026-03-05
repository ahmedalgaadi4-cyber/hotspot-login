let speedInterval = null;
let dataUsage = 0;
let dataInterval = null;

/* تحديث الوقت والتاريخ */

function updateDateTime() {

const now = new Date();

const dateElem = document.getElementById("date");
const timeElem = document.getElementById("time");

const dateOptions = { weekday:'long', year:'numeric', month:'long', day:'numeric' };

if(dateElem) dateElem.textContent = now.toLocaleDateString('ar-EG',dateOptions);

if(timeElem) timeElem.textContent = now.toLocaleTimeString('ar-EG');

}

setInterval(updateDateTime,1000);
updateDateTime();



/* الوضع الليلي */

const themeToggle=document.getElementById("themeToggle");

themeToggle.addEventListener("click",()=>{

document.body.classList.toggle("dark");

themeToggle.textContent=document.body.classList.contains("dark") ? "☀️":"🌙";

});



/* عناصر النظام */

const loginForm=document.getElementById("loginForm");
const statusTxt=document.getElementById("status");
const dot=document.getElementById("connectionDot");
const cardInput=document.getElementById("cardInput");
const countdownTxt=document.getElementById("countdown");
const progressInner=document.querySelector(".progress");
const logoutBtn=document.getElementById("logoutBtn");
const speedSelect=document.getElementById("speedSelect");
const toast=document.getElementById("toast");



let timerInterval=null;



/* toast */

function showToast(msg){

toast.textContent=msg;

toast.style.display="block";

setTimeout(()=>{

toast.style.display="none";

},3000);

}



/* النوافذ المنبثقة */

const popup=document.getElementById("popup");
const popupTitle=document.getElementById("popupTitle");
const popupText=document.getElementById("popupText");
const popupTimer=document.getElementById("popupTimer");
const popupBtn=document.getElementById("popupBtn");



function showLoginPopup(){

popupTitle.textContent="✅ تم تسجيل الدخول بنجاح";

popupText.textContent="تم الاتصال بالشبكة";

popupTimer.textContent="";

popup.style.display="flex";

popupBtn.onclick=function(){

popup.style.display="none";

};

}



function showLogoutPopup(){

popupTitle.textContent="⚠️ تم تسجيل خروجك";

popupText.textContent="يمكنك تسجيل الدخول مرة أخرى";

let seconds=5;

popupTimer.textContent=seconds;

popup.style.display="flex";

let timer=setInterval(()=>{

seconds--;

popupTimer.textContent=seconds;

if(seconds<=0){

clearInterval(timer);

popup.style.display="none";

}

},1000);

popupBtn.onclick=function(){

popup.style.display="none";

};

}



/* بدء الجلسة */

function startSession(expiry,duration){

document.getElementById("speedBox").style.display="block";

speedInterval=setInterval(()=>{

const speed=(Math.random()*40+10).toFixed(1);

document.getElementById("speedValue").textContent=speed;

},2000);



statusTxt.textContent="متصل";
statusTxt.style.color="#00ffcc";

dot.className="dot online";



document.getElementById("timerBox").style.display="block";
document.getElementById("progressBar").style.display="block";
document.getElementById("dataUsageBox").style.display="block";



dataInterval=setInterval(()=>{

dataUsage+=Math.floor(Math.random()*3)+1;

document.getElementById("dataUsage").textContent=dataUsage;

},3000);



logoutBtn.style.display="block";

document.getElementById("mainCard").classList.add("connected");



if(timerInterval) clearInterval(timerInterval);



timerInterval=setInterval(()=>{

const now=Date.now();

const remaining=Math.floor((expiry-now)/1000);



if(remaining<=0){

endSession();

return;

}



const h=Math.floor(remaining/3600).toString().padStart(2,'0');

const m=Math.floor((remaining%3600)/60).toString().padStart(2,'0');

const s=(remaining%60).toString().padStart(2,'0');



countdownTxt.textContent=`${h}:${m}:${s}`;



const percentage=(remaining/duration)*100;

progressInner.style.width=percentage+"%";



},1000);

}



/* إنهاء الجلسة */

function endSession(){

clearInterval(speedInterval);

clearInterval(dataInterval);

clearInterval(timerInterval);



document.getElementById("speedBox").style.display="none";

document.getElementById("speedValue").textContent="0";



localStorage.removeItem("hotspot_session");



statusTxt.textContent="غير متصل";

statusTxt.style.color="#fff";

dot.className="dot offline";



document.getElementById("timerBox").style.display="none";

document.getElementById("progressBar").style.display="none";

document.getElementById("dataUsageBox").style.display="none";



logoutBtn.style.display="none";



dataUsage=0;

document.getElementById("dataUsage").textContent="0";



document.getElementById("mainCard").classList.remove("connected");

}



/* تسجيل الدخول */

loginForm.addEventListener("submit",(e)=>{

e.preventDefault();

showToast("⏳ جاري الاتصال ...");



setTimeout(()=>{

let duration=3600;



const speed=speedSelect.value;



if(speed==="normal") duration=3600;

if(speed==="medium") duration=5400;

if(speed==="high") duration=7200;

if(speed==="ultra") duration=9000;



const expiry=Date.now()+(duration*1000);



localStorage.setItem("hotspot_session",

JSON.stringify({expiry,duration})

);



startSession(expiry,duration);



showLoginPopup();



},1200);

});



/* تسجيل الخروج */

logoutBtn.addEventListener("click",()=>{

endSession();

showLogoutPopup();

});



/* حفظ الكرت */

document.getElementById("saveCardBtn").addEventListener("click",()=>{

const val=cardInput.value.trim();



if(val){

localStorage.setItem("saved_card",val);

showToast("💾 تم حفظ رقم الكرت");

}else{

showToast("❌ أدخل رقم الكرت أولاً");

}

});



/* صفحة الباقات */

const plansPage=document.getElementById("plansPage");

const openPlans=[

document.getElementById("plansBtn"),

document.getElementById("openPlansLink")

];



openPlans.forEach(btn=>{

btn.onclick=(e)=>{

e.preventDefault();

plansPage.style.display="flex";

};

});



document.querySelector(".closePlans").onclick=()=>{

plansPage.style.display="none";

};



window.onclick=(e)=>{

if(e.target==plansPage){

plansPage.style.display="none";

}

};



/* تحميل البيانات */

window.onload=()=>{

const savedCard=localStorage.getItem("saved_card");

if(savedCard) cardInput.value=savedCard;



const session=JSON.parse(

localStorage.getItem("hotspot_session")

);



if(session && session.expiry>Date.now()){

startSession(session.expiry,session.duration);

}

};