/* =============================================
   شبكة غزة نت - script.js
   ============================================= */

let connectionTimer = null
let speedInterval = null
let timerInterval = null
let dataInterval = null
let connectedSeconds = 0        // ✅ نطاق عام لتجنب إعادة التعريف

let failedAttempts = 0
let dataUsage = 0
let sessionStart = null
let sessionDuration = 0
let totalData = 0
let manualLogout = false
let sessionExpiry = null        // ✅ حفظ وقت الانتهاء للاستخدام في popupRemainingTime

/* ───── عناصر الواجهة ───── */

const loginForm            = document.getElementById("loginForm")
const statusTxt            = document.getElementById("status")
const dot                  = document.getElementById("connectionDot")
const cardInput            = document.getElementById("cardInput")
const countdownTxt         = document.getElementById("countdown")
const progressInner        = document.querySelector(".progress")
const logoutBtn            = document.getElementById("logoutBtn")
const speedSelect          = document.getElementById("speedSelect")
const toast                = document.getElementById("toast")

const popup                = document.getElementById("popup")
const popupTitle           = document.getElementById("popupTitle")
const popupText            = document.getElementById("popupText")
const popupUser            = document.getElementById("popupUser")
const popupTime            = document.getElementById("popupTime")
const popupUsage           = document.getElementById("popupUsage")
const popupRemainingTime   = document.getElementById("popupRemainingTime")
const popupRemainingData   = document.getElementById("popupRemainingData")
const sessionDataBox       = document.getElementById("sessionDataBox")

/* ───── التاريخ والوقت ───── */

function updateDateTime() {
  const now = new Date()
  document.getElementById("date").textContent =
    now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  document.getElementById("time").textContent =
    now.toLocaleTimeString('ar-EG')
}

setInterval(updateDateTime, 1000)
updateDateTime()

/* ───── Toast ───── */

function showToast(msg) {
  toast.textContent = msg
  toast.style.display = "block"
  setTimeout(() => { toast.style.display = "none" }, 3000)
}

/* ───── نظام الحظر ───── */

function showBlockScreen(blockUntil){

const screen = document.getElementById("blockedScreen")
const timer  = document.getElementById("blockTimer")

if(!screen || !timer) return

screen.style.display = "flex"

const interval = setInterval(()=>{

const remaining = Math.floor((blockUntil - Date.now()) / 1000)

if(remaining <= 0){

clearInterval(interval)

localStorage.removeItem("hotspot_block_until")
localStorage.removeItem("hotspot_attempts")

location.reload()

return
}

const m = Math.floor(remaining / 60)
const s = remaining % 60

timer.textContent = m + " : " + s

},1000)

}

/* ───── بدء الجلسة ───── */

function startSession(expiry, duration) {
  sessionStart    = Date.now()
  sessionExpiry   = expiry
  sessionDuration = duration
  dataUsage       = 0
  connectedSeconds = 0   // ✅ إعادة ضبط العداد

  // حفظ الجلسة في localStorage
  localStorage.setItem("hotspot_active",   "1")
  localStorage.setItem("hotspot_start",    sessionStart)
  localStorage.setItem("hotspot_duration", duration)
  localStorage.setItem("hotspot_card",     cardInput.value)

  // تحديد الحد الأقصى للبيانات
  const dataLimits = { normal: 300, medium: 600, high: 900, ultra: 1500 }
  totalData = dataLimits[speedSelect.value] || 600

  progressInner.style.width = "100%"

  statusTxt.textContent  = "متصل"
  dot.className          = "dot online"

  // ✅ إخفاء عناصر واجهة الكرت الرئيسية (لوحة الجلسة تعرضها)
  document.getElementById("timerBox").style.display     = "none"
  document.getElementById("dataUsageBox").style.display = "none"
  document.getElementById("speedBox").style.display     = "none"
  document.getElementById("progressBar").style.display  = "none"
  document.getElementById("mainCard").classList.add("connected")

  /* قياس السرعة */
  async function measureSpeed() {
    try {
      const t0       = performance.now()
      const response = await fetch("https://speed.cloudflare.com/__down?bytes=1000000")
      const blob     = await response.blob()
      const t1       = performance.now()
      const sec      = (t1 - t0) / 1000
      const speedMbps = ((blob.size * 8) / sec / 1024 / 1024).toFixed(1)
      document.getElementById("speedValue").textContent = speedMbps
    } catch {
      document.getElementById("speedValue").textContent = "--"
    }
  }

  speedInterval = setInterval(measureSpeed, 5000)
  measureSpeed()

  /* استهلاك البيانات */
  dataInterval = setInterval(() => {
    dataUsage += Math.floor(Math.random() * 3) + 1

    document.getElementById("dataUsage").textContent = dataUsage

    // تحديث التنزيل/الرفع في لوحة الجلسة
    const dl = (Math.random() * 500 + 50).toFixed(0)
    const ul = (Math.random() * 100 + 10).toFixed(0)
    const sessionDownload = document.getElementById("sessionDownload")
    const sessionUpload   = document.getElementById("sessionUpload")
    if (sessionDownload) sessionDownload.textContent = dl + " KB"
    if (sessionUpload)   sessionUpload.textContent   = ul + " KB"

    // انتهاء البيانات
    if (dataUsage >= totalData) {
      showToast("⚠ انتهت البيانات!")
      endSession()
    }
  }, 3000)

  /* عداد الوقت المتبقي */
  timerInterval = setInterval(() => {
    const now       = Date.now()
    const remaining = Math.floor((expiry - now) / 1000)

    if (remaining <= 0) {
      endSession()
      return
    }

    const h = Math.floor(remaining / 3600).toString().padStart(2, '0')
    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0')
    const s = (remaining % 60).toString().padStart(2, '0')

    countdownTxt.textContent = `${h}:${m}:${s}`

    // تحديث الوقت المتبقي في لوحة الجلسة
    const sessionRemain = document.getElementById("sessionRemain")
    if (sessionRemain) sessionRemain.textContent = `${h}:${m}:${s}`

    const percentage = (remaining / duration) * 100
    progressInner.style.width = percentage + "%"

  }, 1000)

  /* عداد وقت الاتصال */
  connectionTimer = setInterval(() => {
    connectedSeconds++
    const m = Math.floor(connectedSeconds / 60)
    const s = connectedSeconds % 60
    const sessionConnected = document.getElementById("sessionConnected")
    if (sessionConnected) sessionConnected.textContent = `${m}m ${s}s`
  }, 1000)
}

/* ───── إنهاء الجلسة ───── */

function endSession() {
  // ✅ منع التكرار
  if (!sessionStart) return

  localStorage.removeItem("hotspot_active")
  localStorage.removeItem("hotspot_start")
  localStorage.removeItem("hotspot_duration")
  localStorage.removeItem("hotspot_card")

  clearInterval(speedInterval)
  clearInterval(timerInterval)
  clearInterval(dataInterval)
  clearInterval(connectionTimer)

  document.getElementById("speedBox").style.display     = "none"
  document.getElementById("timerBox").style.display     = "none"
  document.getElementById("progressBar").style.display  = "none"
  document.getElementById("dataUsageBox").style.display = "none"

  statusTxt.textContent = "غير متصل"
  dot.className         = "dot offline"

  document.getElementById("mainCard").classList.remove("connected")

  // حساب وقت الجلسة
  const sessionTime = Math.floor((Date.now() - sessionStart) / 1000)
  const m = Math.floor(sessionTime / 60)
  const s = sessionTime % 60

  if (manualLogout) {
    popupTitle.textContent = "تم تسجيل الخروج بنجاح"
    popupText.textContent  = "بيانات الجلسة"
  } else {
    popupTitle.textContent = "انتهت صلاحية الجلسة"
    popupText.textContent  = "يرجى إدخال كرت جديد"

    const expiredMsg = document.getElementById("cardExpiredMsg")
    if (expiredMsg) expiredMsg.style.display = "block"
  }

  popupUser.textContent  = cardInput.value
  popupTime.textContent  = `${m} دقيقة ${s} ثانية`
  popupUsage.textContent = dataUsage

  // الوقت المتبقي
  let remainingTime = sessionDuration - sessionTime
  if (remainingTime < 0) remainingTime = 0
  const rh = Math.floor(remainingTime / 3600).toString().padStart(2, '0')
  const rm = Math.floor((remainingTime % 3600) / 60).toString().padStart(2, '0')
  const rs = (remainingTime % 60).toString().padStart(2, '0')
  if (popupRemainingTime) popupRemainingTime.textContent = `${rh}:${rm}:${rs}`

  // البيانات المتبقية
  let remainingData = totalData - dataUsage
  if (remainingData < 0) remainingData = 0
  if (popupRemainingData) popupRemainingData.textContent = remainingData

  // أزرار الـ popup
  const continueBtn = document.getElementById("continueSessionBtn")
  const exitBtn     = document.getElementById("finalExitBtn")
  if (continueBtn) continueBtn.style.display = "block"
  if (exitBtn)     exitBtn.style.display     = "block"

  sessionDataBox.style.display = "grid"

  // إخفاء لوحة الجلسة وإظهار الكرت الرئيسي
  document.getElementById("sessionPanel").style.display = "none"
  document.getElementById("mainCard").style.display     = "block"

  popup.style.display = "flex"

  sessionStart = null   // ✅ يجب أن يكون آخر سطر

  /* زر موافق */
  const popupOkBtn = document.getElementById("popupOkBtn")
  if (popupOkBtn) {
    popupOkBtn.onclick = () => {
      popup.style.display = "none"
    }
  }
}

/* ───── تسجيل الدخول ───── */

loginForm.addEventListener("submit", (e) => {
  e.preventDefault()

  // التحقق من الحظر أولاً
  const blockUntil = localStorage.getItem("hotspot_block_until")
  if (blockUntil && Date.now() < parseInt(blockUntil)) {
showBlockScreen(parseInt(blockUntil))
    return
  }

  if (speedSelect.value === "") {
    speedSelect.value = "medium"
    showToast("تم اختيار السرعة المتوسطة تلقائياً")
  }

  showToast("جاري الاتصال ...")

  setTimeout(() => {
    const durations = { normal: 3600, medium: 5400, high: 7200, ultra: 9000 }
    const duration  = durations[speedSelect.value] || 5400
    const expiry    = Date.now() + duration * 1000

    startSession(expiry, duration)

    // إخفاء رسالة انتهاء الكرت
    const expiredMsg = document.getElementById("cardExpiredMsg")
    if (expiredMsg) expiredMsg.style.display = "none"

    popupTitle.textContent = "تم تسجيل الدخول بنجاح"
    popupText.textContent  = "تم الاتصال بالشبكة"

    sessionDataBox.style.display = "none"

    // إخفاء أزرار الخروج في popup الترحيب
    const continueBtn = document.getElementById("continueSessionBtn")
    const exitBtn     = document.getElementById("finalExitBtn")
    if (continueBtn) continueBtn.style.display = "none"
    if (exitBtn)     exitBtn.style.display     = "none"

    popup.style.display = "flex"

    // زر موافق → فتح لوحة الجلسة
    const popupOkBtn = document.getElementById("popupOkBtn")
    if (popupOkBtn) {
      popupOkBtn.onclick = () => {
        popup.style.display = "none"
        document.getElementById("mainCard").style.display = "none"

        if (sessionStart) {
          const panel = document.getElementById("sessionPanel")
          panel.style.display = "flex"
          document.getElementById("sessionUser").textContent = cardInput.value
          document.getElementById("sessionIP").textContent   = "172.17.20.14"
        }
      }
    }

  }, 1200)
})

/* ───── تسجيل الخروج (زر الكرت الرئيسي) ───── */

logoutBtn.addEventListener("click", () => {
  manualLogout = true
  endSession()
  manualLogout = false
})

/* ───── تسجيل الخروج (زر لوحة الجلسة) ───── */

const sessionLogoutBtn = document.getElementById("sessionLogoutBtn")
if (sessionLogoutBtn) {
  sessionLogoutBtn.onclick = () => {
    manualLogout = true
    endSession()
    manualLogout = false
  }
}

/* ───── حفظ الكرت ───── */

document.getElementById("saveCardBtn").addEventListener("click", () => {
  const val = cardInput.value.trim()
  if (!val) {
    showToast("ادخل رقم الكرت")
    return
  }
  localStorage.setItem("saved_card", val)
  showToast("تم حفظ الكرت ✅")
})

/* ───── اتصال تلقائي إذا كان الكرت محفوظاً ───── */
// (يتم في DOMContentLoaded أدناه)

/* ───── الوضع الليلي ───── */

const themeToggle = document.getElementById("themeToggle")

// استعادة الوضع المحفوظ
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark")
  themeToggle.textContent = "☀️"
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark")
  const isDark = document.body.classList.contains("dark")
  themeToggle.textContent = isDark ? "☀️" : "🌙"
  localStorage.setItem("theme", isDark ? "dark" : "light")
}

/* ───── صفحة الباقات ───── */

const plansPage  = document.getElementById("plansPage")
const closePlans = document.querySelector(".closePlans")

document.getElementById("plansBtn").onclick = () => {
  plansPage.style.display = "flex"
}

if (closePlans) {
  closePlans.onclick = () => { plansPage.style.display = "none" }
}

window.onclick = (e) => {
  if (e.target === plansPage)   plansPage.style.display   = "none"
  if (e.target === centersPage) centersPage.style.display = "none"
}

/* ───── صفحة المراكز ───── */

const centersPage  = document.getElementById("centersPage")
const centersBtn   = document.getElementById("centersBtn")
const closeCenters = document.querySelector(".closeCenters")

if (centersBtn) {
  centersBtn.onclick = () => { centersPage.style.display = "flex" }
}

if (closeCenters) {
  closeCenters.onclick = () => { centersPage.style.display = "none" }
}

/* ───── تغيير السرعة من لوحة الجلسة ───── */

const changeSpeedBtn = document.getElementById("changeSpeedBtn")
const speedChangeBox = document.getElementById("speedChangeBox")
const applySpeedBtn  = document.getElementById("applySpeedBtn")
const newSpeedSelect = document.getElementById("newSpeedSelect")

if (changeSpeedBtn) {
  changeSpeedBtn.onclick = () => {
    speedChangeBox.style.display =
      speedChangeBox.style.display === "none" ? "block" : "none"
  }
}

if (applySpeedBtn) {
  applySpeedBtn.onclick = () => {
    speedSelect.value = newSpeedSelect.value
    // تحديث حد البيانات بالسرعة الجديدة
    const dataLimits = { normal: 300, medium: 600, high: 900, ultra: 1500 }
    totalData = dataLimits[newSpeedSelect.value] || 600
    showToast("تم تغيير السرعة بنجاح ✅")
    speedChangeBox.style.display = "none"
  }
}

/* ───── الدخول مرة أخرى بنفس الجلسة ───── */

const continueSessionBtn = document.getElementById("continueSessionBtn")
if (continueSessionBtn) {
  continueSessionBtn.onclick = () => {
    popup.style.display = "none"

    // إعادة فتح الجلسة من localStorage إن وجدت
    const savedStart    = localStorage.getItem("hotspot_start")
    const savedDuration = localStorage.getItem("hotspot_duration")
    const savedCard     = localStorage.getItem("hotspot_card")

    if (savedStart && savedDuration) {
      const expiry = parseInt(savedStart) + parseInt(savedDuration) * 1000

      if (Date.now() < expiry) {
        if (savedCard) cardInput.value = savedCard
        startSession(expiry, parseInt(savedDuration))

        popupTitle.textContent = "تم تسجيل الدخول بنجاح"
        popupText.textContent  = "تم استعادة الجلسة"
        sessionDataBox.style.display = "none"

        const cBtn = document.getElementById("continueSessionBtn")
        const eBtn = document.getElementById("finalExitBtn")
        if (cBtn) cBtn.style.display = "none"
        if (eBtn) eBtn.style.display = "none"

        popup.style.display = "flex"

        const popupOkBtn = document.getElementById("popupOkBtn")
        if (popupOkBtn) {
          popupOkBtn.onclick = () => {
            popup.style.display = "none"
            document.getElementById("mainCard").style.display = "none"
            const panel = document.getElementById("sessionPanel")
            panel.style.display = "flex"
            document.getElementById("sessionUser").textContent = cardInput.value
            document.getElementById("sessionIP").textContent   = "172.17.20.14"
          }
        }
      } else {
        showToast("⚠ انتهت الجلسة السابقة")
      }
    } else {
      showToast("لا توجد جلسة سابقة")
    }
  }
}

/* ───── خروج نهائي ───── */

const finalExitBtn = document.getElementById("finalExitBtn")

if (finalExitBtn) {

  finalExitBtn.onclick = () => {

    popupTitle.textContent = "تم تسجيل الخروج بشكل نهائي"
    popupText.textContent = "يمكنك الآن استخدام كرت جديد"

    popup.style.display = "flex"
    sessionDataBox.style.display = "none"

    localStorage.removeItem("hotspot_active")
    localStorage.removeItem("hotspot_start")
    localStorage.removeItem("hotspot_duration")
    localStorage.removeItem("hotspot_card")

   setTimeout(() => {

window.location.href = "$(link-logout)?erase-cookie=true"

},1500)

  }

}

/* ───── توفير البيانات ───── */

const dataSaverBtn  = document.getElementById("dataSaverBtn")
const dataSaverMenu = document.getElementById("dataSaverMenu")

if (dataSaverBtn) {
  dataSaverBtn.onclick = () => {
    dataSaverMenu.style.display =
      dataSaverMenu.style.display === "none" ? "block" : "none"
  }
}

const stopPlayUpdates = document.getElementById("stopPlayUpdates")
if (stopPlayUpdates) {
  stopPlayUpdates.onclick = () => {
    showToast("قم بإيقاف تحديثات التطبيقات من إعدادات متجر Play")
    window.open("https://play.google.com/store/apps", "_blank")
  }
}

const stopAutoVideo = document.getElementById("stopAutoVideo")
if (stopAutoVideo) {
  stopAutoVideo.onclick = () => {
    showToast("قم بإيقاف التشغيل التلقائي للفيديو من إعدادات التطبيقات")
  }
}

const stopSystemUpdates = document.getElementById("stopSystemUpdates")
if (stopSystemUpdates) {
  stopSystemUpdates.onclick = () => {
    showToast("قم بإيقاف تحديثات النظام من إعدادات الهاتف")
  }
}

/* ───── عند تحميل الصفحة ───── */

window.addEventListener("DOMContentLoaded", () => {

  // فحص الحظر أولاً
  hotspotCheckBlock()

  // تحميل الكرت المحفوظ
  const saved = localStorage.getItem("saved_card")
  if (saved) cardInput.value = saved

  // ✅ اتصال تلقائي إذا كان الكرت محفوظاً ولا توجد جلسة نشطة
  const autoActive = localStorage.getItem("hotspot_active")
  if (saved && autoActive !== "1") {
    const blockUntil = localStorage.getItem("hotspot_block_until")
    if (!blockUntil || Date.now() >= parseInt(blockUntil)) {
      setTimeout(() => {
        showToast("جاري الاتصال تلقائياً ...")
        loginForm.dispatchEvent(new Event("submit"))
      }, 800)
    }
  }

  // استعادة الجلسة النشطة تلقائياً
  const active   = localStorage.getItem("hotspot_active")
  const start    = localStorage.getItem("hotspot_start")
  const duration = localStorage.getItem("hotspot_duration")
  const card     = localStorage.getItem("hotspot_card")

  if (active === "1" && start && duration) {
    const expiry = parseInt(start) + parseInt(duration) * 1000

    if (Date.now() < expiry) {
      if (card) cardInput.value = card
      startSession(expiry, parseInt(duration))

      const panel = document.getElementById("sessionPanel")
      panel.style.display = "flex"
      document.getElementById("mainCard").style.display   = "none"
      document.getElementById("sessionUser").textContent  = cardInput.value
      document.getElementById("sessionIP").textContent    = "172.17.20.14"
    } else {
      // انتهت الجلسة أثناء الغياب
      localStorage.removeItem("hotspot_active")
      localStorage.removeItem("hotspot_start")
      localStorage.removeItem("hotspot_duration")
      localStorage.removeItem("hotspot_card")
    }
  }
})

window.addEventListener("load", () => {

  hotspotCheckBlock()

  if (typeof MIKROTIK_ERROR !== "undefined" && MIKROTIK_ERROR) {
    hotspotRegisterFailed()
    showToast("⚠ خطأ في تسجيل الدخول")
  }

})