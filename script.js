let speedInterval = null;
let timerInterval = null;
let dataInterval = null;

let dataUsage = 0;
let sessionStart = null;

/* عناصر الصفحة */
const loginForm = document.getElementById("loginForm");
const statusTxt = document.getElementById("status");
const dot = document.getElementById("connectionDot");
const cardInput = document.getElementById("cardInput");
const countdownTxt = document.getElementById("countdown");
const progressInner = document.querySelector(".progress");
const logoutBtn = document.getElementById("logoutBtn");
const speedSelect = document.getElementById("speedSelect");
const toast = document.getElementById("toast");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupText = document.getElementById("popupText");
const popupBtn = document.getElementById("popupBtn");
const exitBtn = document.getElementById("exitBtn");

const popupUser = document.getElementById("popupUser");
const popupTime = document.getElementById("popupTime");
const popupUsage = document.getElementById("popupUsage");
const sessionDataBox = document.getElementById("sessionDataBox");

/* تحديث التاريخ والوقت */
function updateDateTime() {
  const now = new Date();
  document.getElementById("date").textContent =
    now.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById("time").textContent =
    now.toLocaleTimeString('ar-EG');
}
setInterval(updateDateTime,1000);
updateDateTime();

/* Toast */
function showToast(msg){
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(()=>{ toast.style.display = "none"; },3000);
}

/* بدء الجلسة */
function startSession(expiry, duration){
  sessionStart = Date.now();
  dataUsage = 0;
  progressInner.style.width = "100%";

  document.getElementById("speedBox").style.display = "block";
  document.getElementById("timerBox").style.display = "block";
  document.getElementById("progressBar").style.display = "block";
  document.getElementById("dataUsageBox").style.display = "block";

  statusTxt.textContent = "متصل";
  statusTxt.style.color = "#00ffcc";
  dot.className = "dot online";
  logoutBtn.style.display = "block";
  document.getElementById("mainCard").classList.add("connected");

  /* عداد السرعة */
  speedInterval = setInterval(() => {
    const speed = (Math.random() * 40 + 10).toFixed(1);
    document.getElementById("speedValue").textContent = speed;
  }, 2000);

  /* استهلاك البيانات */
  dataInterval = setInterval(() => {
    dataUsage += Math.floor(Math.random() * 3) + 1;
    document.getElementById("dataUsage").textContent = dataUsage;
  }, 3000);

  /* المؤقت */
  timerInterval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.floor((expiry - now) / 1000);
    if (remaining <= 0) {
      endSession();
      return;
    }
    const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    countdownTxt.textContent = `${h}:${m}:${s}`;
    const percentage = (remaining / duration) * 100;
    progressInner.style.width = percentage + "%";
  }, 1000);
}

/* إنهاء الجلسة */
function endSession(){
  clearInterval(speedInterval);
  clearInterval(timerInterval);
  clearInterval(dataInterval);

  document.getElementById("speedBox").style.display = "none";
  document.getElementById("timerBox").style.display = "none";
  document.getElementById("progressBar").style.display = "none";
  document.getElementById("dataUsageBox").style.display = "none";

  statusTxt.textContent = "غير متصل";
  statusTxt.style.color = "#fff";
  dot.className = "dot offline";
  logoutBtn.style.display = "none";
  document.getElementById("mainCard").classList.remove("connected");

  /* حساب مدة الجلسة */
  let sessionTime = Math.floor((Date.now() - sessionStart) / 1000);
  let m = Math.floor(sessionTime / 60);
  let s = sessionTime % 60;

  /* عرض بيانات الجلسة */
  popupTitle.textContent = "تم تسجيل الخروج بنجاح";
  popupText.textContent = "بيانات الجلسة";
  popupUser.textContent = cardInput.value;
  popupTime.textContent = `${m} دقيقة ${s} ثانية`;
  popupUsage.textContent = dataUsage;

  sessionDataBox.style.display = "grid"; // عرض بطاقة البيانات
  popup.style.display = "flex";

  /* زر الدخول مرة أخرى */
  popupBtn.onclick = () => {
    popup.style.display = "none";
    // يُعيد إرسال النموذج لتسجيل الدخول مجددًا
    loginForm.dispatchEvent(new Event("submit"));
  };

  /* زر الخروج */
  if (exitBtn) {
    exitBtn.onclick = () => {
      window.close();
    };
  }
}

/* تسجيل الدخول */
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (speedSelect.value === "") {
    showToast("يجب اختيار سرعة الاتصال أولاً");
    speedSelect.focus();
    return;
  }
  showToast("جاري الاتصال ...");
  setTimeout(() => {
    let duration = 3600;
    const speed = speedSelect.value;
    if (speed === "medium") duration = 5400;
    if (speed === "high") duration = 7200;
    if (speed === "ultra") duration = 9000;
    const expiry = Date.now() + (duration * 1000);
    startSession(expiry, duration);

    /* رسالة تسجيل الدخول */
    popupTitle.textContent = "تم تسجيل الدخول بنجاح";
    popupText.textContent = "تم الاتصال بالشبكة";
    sessionDataBox.style.display = "none"; // إخفاء بيانات الجلسة في نافذة النافذة
    popup.style.display = "flex";

    popupBtn.onclick = () => {
      popup.style.display = "none";
    };
  }, 1200);
});

/* تسجيل الخروج */
logoutBtn.addEventListener("click", () => {
  endSession();
});

/* حفظ الكرت */
document.getElementById("saveCardBtn").addEventListener("click", () => {
  const val = cardInput.value.trim();
  if (val) {
    localStorage.setItem("saved_card", val);
    showToast("تم حفظ الكرت");
  } else {
    showToast("أدخل رقم الكرت");
  }
});

/* تحميل الكرت المحفوظ */
window.onload = () => {
  const savedCard = localStorage.getItem("saved_card");
  if (savedCard) {
    cardInput.value = savedCard;
  }
};

/* الوضع الليلي */
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
}

/* صفحة الباقات */
const plansPage = document.getElementById("plansPage");
const plansBtn = document.getElementById("plansBtn");
const openPlansLink = document.getElementById("openPlansLink");
const closePlans = document.querySelector(".closePlans");
if (plansBtn) {
  plansBtn.onclick = () => { plansPage.style.display = "flex"; };
}
if (openPlansLink) {
  openPlansLink.onclick = (e) => { e.preventDefault(); plansPage.style.display = "flex"; };
}
if (closePlans) {
  closePlans.onclick = () => { plansPage.style.display = "none"; };
}
window.onclick = (e) => {
  if (e.target === plansPage) {
    plansPage.style.display = "none";
  }
};

/* الدخول بالكرت الأخير */
const lastCardLogin = document.getElementById("lastCardLogin");
if (lastCardLogin) {
  lastCardLogin.type = "button"; // تجنب تفعيل الـ submit الافتراضي
  lastCardLogin.onclick = () => {
    const savedCard = localStorage.getItem("saved_card");
    if (!savedCard) {
      showToast("لا يوجد كرت محفوظ");
      return;
    }
    cardInput.value = savedCard;
    // إرسال النموذج لتسجيل الدخول مع الكرت المحفوظ
    loginForm.dispatchEvent(new Event("submit"));
  };
}
