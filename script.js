let connectionTimer=null
let speedInterval=null
let timerInterval=null
let dataInterval=null

let dataUsage=0
let sessionStart=null
let sessionDuration=0
let totalData=0
let manualLogout=false

const loginForm=document.getElementById("loginForm")
const statusTxt=document.getElementById("status")
const dot=document.getElementById("connectionDot")
const cardInput=document.getElementById("cardInput")
const countdownTxt=document.getElementById("countdown")
const progressInner=document.querySelector(".progress")
const logoutBtn=document.getElementById("logoutBtn")
const speedSelect=document.getElementById("speedSelect")
const toast=document.getElementById("toast")

const popup=document.getElementById("popup")
const popupTitle=document.getElementById("popupTitle")
const popupText=document.getElementById("popupText")

const popupUser=document.getElementById("popupUser")
const popupTime=document.getElementById("popupTime")
const popupUsage=document.getElementById("popupUsage")

const popupRemainingTime=document.getElementById("popupRemainingTime")
const popupRemainingData=document.getElementById("popupRemainingData")

const sessionDataBox=document.getElementById("sessionDataBox")

/* التاريخ والوقت */

function updateDateTime(){

const now=new Date()

document.getElementById("date").textContent=
now.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

document.getElementById("time").textContent=
now.toLocaleTimeString('ar-EG')

}

setInterval(updateDateTime,1000)
updateDateTime()

/* toast */

function showToast(msg){

toast.textContent=msg
toast.style.display="block"

setTimeout(()=>{
toast.style.display="none"
},3000)

}

/* بدء الجلسة */

function startSession(expiry,duration){

sessionStart=Date.now()
localStorage.setItem("hotspot_active","1")
localStorage.setItem("hotspot_start",sessionStart)
localStorage.setItem("hotspot_duration",duration)
sessionDuration=duration
dataUsage=0

if(speedSelect.value==="normal") totalData=300
if(speedSelect.value==="medium") totalData=600
if(speedSelect.value==="high") totalData=900
if(speedSelect.value==="ultra") totalData=1500

progressInner.style.width="100%"

document.getElementById("speedBox").style.display="block"
document.getElementById("timerBox").style.display="block"
document.getElementById("progressBar").style.display="block"
document.getElementById("dataUsageBox").style.display="block"

statusTxt.textContent="متصل"
dot.className="dot online"

logoutBtn.style.display="block"

document.getElementById("mainCard").classList.add("connected")

async function measureSpeed(){

try{

const startTime = performance.now()

const response = await fetch("https://speed.cloudflare.com/__down?bytes=1000000")

const blob = await response.blob()

const endTime = performance.now()

const duration = (endTime - startTime) / 1000

const bitsLoaded = blob.size * 8

const speedMbps = (bitsLoaded / duration / 1024 / 1024).toFixed(1)

document.getElementById("speedValue").textContent = speedMbps

}catch(e){

document.getElementById("speedValue").textContent = "--"

}

}

speedInterval = setInterval(measureSpeed,5000)
measureSpeed()

dataInterval=setInterval(()=>{

dataUsage+=Math.floor(Math.random()*3)+1

document.getElementById("dataUsage").textContent=dataUsage

},3000)

timerInterval=setInterval(()=>{

const now=Date.now()
const remaining=Math.floor((expiry-now)/1000)

if(remaining<=0){
endSession()
return
}

const h=Math.floor(remaining/3600).toString().padStart(2,'0')
const m=Math.floor((remaining%3600)/60).toString().padStart(2,'0')
const s=(remaining%60).toString().padStart(2,'0')

countdownTxt.textContent=`${h}:${m}:${s}`

const percentage=(remaining/duration)*100
progressInner.style.width=percentage+"%"

},1000)
let connectedSeconds=0

connectionTimer=setInterval(()=>{

connectedSeconds++

let m=Math.floor(connectedSeconds/60)
let s=connectedSeconds%60

document.getElementById("sessionConnected").textContent =
`${m}m ${s}s`

},1000)
}

/* إنهاء الجلسة */

function endSession(){
    localStorage.removeItem("hotspot_active")
localStorage.removeItem("hotspot_start")
localStorage.removeItem("hotspot_duration")

if(!sessionStart)return

clearInterval(speedInterval)
clearInterval(timerInterval)
clearInterval(dataInterval)
clearInterval(connectionTimer)

document.getElementById("speedBox").style.display="none"
document.getElementById("timerBox").style.display="none"
document.getElementById("progressBar").style.display="none"
document.getElementById("dataUsageBox").style.display="none"

statusTxt.textContent="غير متصل"
dot.className="dot offline"
logoutBtn.style.display="none"

document.getElementById("mainCard").classList.remove("connected")

let sessionTime=Math.floor((Date.now()-sessionStart)/1000)

let m=Math.floor(sessionTime/60)
let s=sessionTime%60

if(manualLogout){

popupTitle.textContent="تم تسجيل الخروج بنجاح"
popupText.textContent="بيانات الجلسة"

}else{

popupTitle.textContent="انتهت صلاحية الجلسة"
popupText.textContent="يرجى إدخال كرت جديد"

/* اظهار رسالة انتهاء الكرت في الصفحة */

const expiredMsg=document.getElementById("cardExpiredMsg")
if(expiredMsg) expiredMsg.style.display="block"

}

popupUser.textContent=cardInput.value
popupTime.textContent=`${m} دقيقة ${s} ثانية`
popupUsage.textContent=dataUsage

let remainingTime=sessionDuration-sessionTime
if(remainingTime<0)remainingTime=0

let rh=Math.floor(remainingTime/3600).toString().padStart(2,'0')
let rm=Math.floor((remainingTime%3600)/60).toString().padStart(2,'0')
let rs=(remainingTime%60).toString().padStart(2,'0')

popupRemainingTime.textContent=`${rh}:${rm}:${rs}`

let remainingData=totalData-dataUsage
if(remainingData<0)remainingData=0

popupRemainingData.textContent=remainingData

sessionDataBox.style.display="grid"
popup.style.display="flex"
/* اظهار ازرار الجلسة عند تسجيل الخروج */

const continueBtn=document.getElementById("continueSessionBtn")
const exitBtn=document.getElementById("finalExitBtn")

if(continueBtn) continueBtn.style.display="block"
if(exitBtn) exitBtn.style.display="block"

sessionStart=null

const popupOkBtn=document.getElementById("popupOkBtn")

if(popupOkBtn){

popupOkBtn.onclick=()=>{
popup.style.display="none"
}

}

}

/* تسجيل الدخول */

loginForm.addEventListener("submit",(e)=>{

e.preventDefault()

if(speedSelect.value===""){
speedSelect.value="medium"
showToast("تم اختيار السرعة المتوسطة تلقائياً")
}

showToast("جاري الاتصال ...")

setTimeout(()=>{

let duration=3600

if(speedSelect.value==="medium")duration=5400
if(speedSelect.value==="high")duration=7200
if(speedSelect.value==="ultra")duration=9000

const expiry=Date.now()+duration*1000

startSession(expiry,duration)
const expiredMsg=document.getElementById("cardExpiredMsg")
if(expiredMsg) expiredMsg.style.display="none"

popupTitle.textContent="تم تسجيل الدخول بنجاح"
popupText.textContent="تم الاتصال بالشبكة"

sessionDataBox.style.display="none"

/* اخفاء ازرار الخروج */

const continueBtn=document.getElementById("continueSessionBtn")
const exitBtn=document.getElementById("finalExitBtn")

if(continueBtn) continueBtn.style.display="none"
if(exitBtn) exitBtn.style.display="none"

popup.style.display="flex"

const popupOkBtn=document.getElementById("popupOkBtn")

if(popupOkBtn){

popupOkBtn.onclick=()=>{

popup.style.display="none"

/* افتح لوحة الجلسة فقط اذا كان متصل */

if(sessionStart){

const panel=document.getElementById("sessionPanel")

panel.style.display="flex"

document.getElementById("sessionUser").textContent=cardInput.value
document.getElementById("sessionIP").textContent="172.17.20.14"

}

}

}

},1200)

})

/* تسجيل الخروج */

logoutBtn.addEventListener("click",()=>{

manualLogout=true
endSession()
manualLogout=false

})

/* حفظ الكرت */

document.getElementById("saveCardBtn").addEventListener("click",()=>{

const val=cardInput.value.trim()

if(!val){
showToast("ادخل رقم الكرت")
return
}

localStorage.setItem("saved_card",val)
showToast("تم حفظ الكرت")

})

/* تحميل الكرت */

window.addEventListener("DOMContentLoaded",()=>{

const saved = localStorage.getItem("saved_card")
if(saved) cardInput.value = saved

const active = localStorage.getItem("hotspot_active")
const start = localStorage.getItem("hotspot_start")
const duration = localStorage.getItem("hotspot_duration")

if(active==="1" && start && duration){

const expiry = parseInt(start) + parseInt(duration)*1000

/* إعادة تشغيل الجلسة */

startSession(expiry, parseInt(duration))

/* فتح نافذة الجلسة مباشرة */

const panel = document.getElementById("sessionPanel")
panel.style.display = "flex"

document.getElementById("sessionUser").textContent = cardInput.value
document.getElementById("sessionIP").textContent = "172.17.20.14"

}

})

/* الوضع الليلي */

const themeToggle=document.getElementById("themeToggle")

themeToggle.onclick=()=>{

document.body.classList.toggle("dark")

themeToggle.textContent=
document.body.classList.contains("dark")?"☀️":"🌙"

}

/* الباقات */

const plansPage=document.getElementById("plansPage")
const closePlans=document.querySelector(".closePlans")

document.getElementById("plansBtn").onclick=()=>{
plansPage.style.display="flex"
}

if(closePlans){
closePlans.onclick=()=>{
plansPage.style.display="none"
}
}

window.onclick=(e)=>{
if(e.target===plansPage){
plansPage.style.display="none"
}
}

/* الكرت المحفوظ */

document.getElementById("lastCardLogin").onclick=()=>{

const saved=localStorage.getItem("saved_card")

if(!saved){
showToast("لا يوجد كرت محفوظ")
return
}

cardInput.value=saved
loginForm.dispatchEvent(new Event("submit"))

}

/* المراكز */

const centersPage=document.getElementById("centersPage")
const centersBtn=document.getElementById("centersBtn")
const closeCenters=document.querySelector(".closeCenters")

if(centersBtn){
centersBtn.onclick=()=>{
centersPage.style.display="flex"
}
}

if(closeCenters){
closeCenters.onclick=()=>{
centersPage.style.display="none"
}
}


const changeSpeedBtn=document.getElementById("changeSpeedBtn")
const speedChangeBox=document.getElementById("speedChangeBox")
const applySpeedBtn=document.getElementById("applySpeedBtn")
const newSpeedSelect=document.getElementById("newSpeedSelect")

if(changeSpeedBtn){

changeSpeedBtn.onclick=()=>{

speedChangeBox.style.display="block"

}

}

if(applySpeedBtn){

applySpeedBtn.onclick=()=>{

const newSpeed=newSpeedSelect.value

speedSelect.value=newSpeed

showToast("تم تغيير السرعة بنجاح")

speedChangeBox.style.display="none"

}

}
const sessionLogoutBtn = document.getElementById("sessionLogoutBtn")

if(sessionLogoutBtn){

sessionLogoutBtn.onclick = ()=>{

document.getElementById("sessionPanel").style.display = "none"

manualLogout = true
endSession()
manualLogout = false

}

}
/* الدخول مرة أخرى بنفس الجلسة */

const continueSessionBtn = document.getElementById("continueSessionBtn")

if(continueSessionBtn){

continueSessionBtn.onclick = ()=>{

popup.style.display = "none"

/* رسالة الترحيب */

popupTitle.textContent = "تم تسجيل الدخول بنجاح"
popupText.textContent = "تم استعادة الجلسة"

sessionDataBox.style.display = "none"

/* اخفاء ازرار الجلسة */

const continueBtn=document.getElementById("continueSessionBtn")
const exitBtn=document.getElementById("finalExitBtn")

if(continueBtn) continueBtn.style.display="none"
if(exitBtn) exitBtn.style.display="none"


popup.style.display = "flex"

const popupOkBtn = document.getElementById("popupOkBtn")

if(popupOkBtn){

popupOkBtn.onclick = ()=>{

popup.style.display = "none"

/* فتح لوحة الجلسة */

const panel = document.getElementById("sessionPanel")

panel.style.display = "flex"

document.getElementById("sessionUser").textContent = cardInput.value
document.getElementById("sessionIP").textContent = "172.17.20.14"

}

}

}

}
/* خروج نهائي */

const finalExitBtn = document.getElementById("finalExitBtn")

if(finalExitBtn){

finalExitBtn.onclick = ()=>{

popup.style.display = "none"

/* العودة لصفحة تسجيل الدخول */

document.getElementById("sessionPanel").style.display = "none"

}

}