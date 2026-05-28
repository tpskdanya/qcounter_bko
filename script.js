document.addEventListener("DOMContentLoaded", () => {
  // Элементы DOM
  const citySel = document.getElementById("city");
  const gradeSel = document.getElementById("grade");
  const formatSel = document.getElementById("format");
  const hoursWith = document.getElementById("hoursWith");
  const hoursWithout = document.getElementById("hoursWithout");
  const hoursBuffer = document.getElementById("hoursBuffer");

  const wInputs = [document.getElementById("w1"), document.getElementById("w2"), document.getElementById("w3"), document.getElementById("w4")];
  const vInputs = [document.getElementById("v1"), document.getElementById("v2"), document.getElementById("v3"), document.getElementById("v4")];

  const rateOut = document.getElementById("rate");
  const okladOut = document.getElementById("oklad");
  const bonusOut = document.getElementById("bonus");
  const totalOut = document.getElementById("total");
  const weightNote = document.getElementById("weightNote");

  // Заполнение городов и грейдов
  function populateCities() {
    citySel.innerHTML = "";
    Object.keys(salaryData).forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySel.appendChild(opt);
    });
  }

  function populateGrades(city) {
    gradeSel.innerHTML = "";
    const grades = salaryData[city] || {};
    Object.keys(grades).forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      gradeSel.appendChild(opt);
    });
  }

  populateCities();
  if (citySel.options.length > 0) populateGrades(citySel.value);

  // События
  citySel.addEventListener("change", () => { populateGrades(citySel.value); calculate(); });
  gradeSel.addEventListener("change", calculate);
  formatSel.addEventListener("change", calculate);
  hoursWith.addEventListener("input", calculate);
  hoursWithout.addEventListener("input", calculate);
  hoursBuffer.addEventListener("input", calculate);
  wInputs.forEach(i => i.addEventListener("input", calculate));
  vInputs.forEach(i => i.addEventListener("input", calculate));

  function fmtMoney(n) {
    if (isNaN(n)) return "—";
    return Number(n).toFixed(2) + " ₽";
  }

  function normalizeKPIraw(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    const v = parseFloat(raw);
    if (isNaN(v)) return null;

    if (v < 80) return 0;
    if (v >= 80 && v < 90) return 60;
    if (v >= 90 && v < 100) return 80;
    if (v === 100) return 100;
    if (v > 100) {
      const over = v - 100;
      return Math.min(100 + over * 2.5, 125);
    }
    return null;
  }

  // ==================== ОСНОВНОЙ РАСЧЁТ ====================
  function calculate() {
    const city = citySel.value;
    const grade = gradeSel.value;
    const format = formatSel.value;

    const hw = parseFloat(hoursWith.value) || 0;
    const hwo = parseFloat(hoursWithout.value) || 0;
    const buffer = parseFloat(hoursBuffer.value) || 0;

    const baseRate = (salaryData[city] && salaryData[city][grade]) ? salaryData[city][grade] : 0;
    const rate = format === "MAU" ? baseRate * 1.10 : baseRate;

    // ОКЛАД = ставка × (обычные часы + буфер)
    const oklad = rate * (hw + buffer);

    // БОНУС считается ТОЛЬКО от обычных часов
    const normalOklad = rate * hw;
    const bonusHour = hw > 0 ? (normalOklad / 60) * 40 / hw : 0;
    const baseBonus = bonusHour * hwo;

    // KPI
    const used = [];
    for (let i = 0; i < 4; i++) {
      const wr = wInputs[i].value.trim();
      const vr = vInputs[i].value.trim();
      if (wr === "" && vr === "") continue;
      const w = wr === "" ? 0 : parseFloat(wr);
      const v = vr === "" ? 0 : parseFloat(vr);
      used.push({ w: isNaN(w) ? 0 : w, v: isNaN(v) ? 0 : v });
    }

    let bonus = baseBonus;
    weightNote.style.display = "none";

    if (used.length > 0) {
      const sumW = used.reduce((s, it) => s + it.w, 0);
      let normalizedWeights = sumW === 0 
        ? used.map(() => 100 / used.length)
        : used.map(it => (it.w / sumW) * 100);

      bonus = 0;
      for (let i = 0; i < used.length; i++) {
        const nRaw = normalizeKPIraw(used[i].v);
        const coefficient = nRaw === null ? 0 : nRaw / 100;
        bonus += (baseBonus / 100) * normalizedWeights[i] * coefficient;
      }
    }

    const total = oklad + bonus;

    // ===================== ВЫВОД =====================
    // Ставка/час с MAU +10% снизу мелким текстом
    if (rate > 0) {
      let rateText = fmtMoney(rate);
      if (format === "MAU") {
        rateText += '<span class="mau-note">(MAU +10%)</span>';
      }
      rateOut.innerHTML = rateText;
    } else {
      rateOut.textContent = "—";
    }

    okladOut.textContent = fmtMoney(oklad);
    bonusOut.textContent = fmtMoney(bonus);
    totalOut.textContent = fmtMoney(total);
  }

  calculate();
});