const WEEKS_PER_MONTH = 4.33;
const MIN_FACTOR = 1.5;
const STORAGE_KEY = 'artdasak_tarifas_state';

const elements = {
  desiredMonthlyIncome: document.getElementById('desiredMonthlyIncome'),
  dailyHours: document.getElementById('dailyHours'),
  weeklyDays: document.getElementById('weeklyDays'),
  weeksPerMonth: document.getElementById('weeksPerMonth'),
  minimumFactor: document.getElementById('minimumFactor'),
  mediumFactor: document.getElementById('mediumFactor'),
  idealFactor: document.getElementById('idealFactor'),
  monthlyHoursResult: document.getElementById('monthlyHoursResult'),
  netHourlyValueResult: document.getElementById('netHourlyValueResult'),
  minimumHourlyRateResult: document.getElementById('minimumHourlyRateResult'),
  mediumHourlyRateResult: document.getElementById('mediumHourlyRateResult'),
  idealHourlyRateResult: document.getElementById('idealHourlyRateResult'),
  projectEstimatedTime: document.getElementById('projectEstimatedTime'),
  projectTimeUnit: document.getElementById('projectTimeUnit'),
  projectHoursResult: document.getElementById('projectHoursResult'),
  projectMinimumPriceResult: document.getElementById('projectMinimumPriceResult'),
  projectMediumPriceResult: document.getElementById('projectMediumPriceResult'),
  projectIdealPriceResult: document.getElementById('projectIdealPriceResult'),
  logicExplanation: document.getElementById('logicExplanation'),
  themeToggle: document.getElementById('themeToggle'),
  tooltip: document.getElementById('tooltip'),
  resetButton: document.getElementById('resetButton'),
};

function parsePositiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function clampFactor(value) {
  return Math.max(MIN_FACTOR, parsePositiveNumber(value, MIN_FACTOR));
}

/**
 * Extrae el valor numérico limpio de un string monetario formateado.
 * "$ 3 000 000" → 3000000 | "3000000" → 3000000
 */
function parseMonetaryValue(str) {
  const clean = String(str).replace(/[^0-9]/g, '');
  const n = Number(clean);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Formatea un número como valor monetario para mostrar en inputs y displays.
 * 3000000 → "$ 3 000 000"
 */
function formatMonetaryInput(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return '';
  return '$ ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
}

/**
 * Formatea un valor numérico como moneda para los resultados.
 * 3000000 → "$ 3 000 000" (mismo patrón visual, espacio de separación de miles)
 */
function formatCurrency(value) {
  const n = Math.round(value);
  if (!Number.isFinite(n)) return '$ 0';
  return '$ ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Redondea hacia arriba al siguiente múltiplo exacto de 1.000.
 * Si el valor ya es múltiplo de 1.000, lo devuelve sin cambios.
 * Ejemplo: 19.001 → 20.000 | 20.000 → 20.000 | 20.001 → 21.000
 */
function ceilTo1000(value) {
  return Math.ceil(value / 1000) * 1000;
}

function normalizeFactors() {
  const minimumFactor = clampFactor(elements.minimumFactor.value);
  const mediumFactor = clampFactor(elements.mediumFactor.value);
  const idealFactor = clampFactor(elements.idealFactor.value);

  elements.minimumFactor.value = minimumFactor.toFixed(1);
  elements.mediumFactor.value = mediumFactor.toFixed(1);
  elements.idealFactor.value = idealFactor.toFixed(1);

  return { minimumFactor, mediumFactor, idealFactor };
}

function getHourlyContext() {
  // parseMonetaryValue limpia el formato visual antes de calcular
  const desiredMonthlyIncome = parseMonetaryValue(elements.desiredMonthlyIncome.value) || 1;
  const MAX_DAILY_HOURS = 24;
  let dailyHours = parsePositiveNumber(elements.dailyHours.value, 1);
  if (dailyHours > MAX_DAILY_HOURS) {
    dailyHours = MAX_DAILY_HOURS;
    elements.dailyHours.value = MAX_DAILY_HOURS;
  }
  const weeklyDays = parsePositiveNumber(elements.weeklyDays.value, 1);
  const { minimumFactor, mediumFactor, idealFactor } = normalizeFactors();

  const monthlyHours = dailyHours * weeklyDays * WEEKS_PER_MONTH;

  // Valor base redondeado hacia arriba al siguiente múltiplo de 1.000
  const netHourlyValueRaw = desiredMonthlyIncome / monthlyHours;
  const netHourlyValue = ceilTo1000(netHourlyValueRaw);

  // Las tarifas se calculan desde el valor base ya redondeado
  // y también se redondean hacia arriba de forma independiente
  const minimumHourlyRate = ceilTo1000(netHourlyValue * minimumFactor);
  const mediumHourlyRate  = ceilTo1000(netHourlyValue * mediumFactor);
  const idealHourlyRate   = ceilTo1000(netHourlyValue * idealFactor);

  return {
    desiredMonthlyIncome,
    dailyHours,
    weeklyDays,
    monthlyHours,
    netHourlyValue,
    minimumFactor,
    mediumFactor,
    idealFactor,
    minimumHourlyRate,
    mediumHourlyRate,
    idealHourlyRate,
  };
}

function convertProjectTimeToHours(projectTime, unit, context) {
  const { dailyHours, weeklyDays, monthlyHours } = context;

  switch (unit) {
    case 'day':
      return projectTime * dailyHours;
    case 'week':
      return projectTime * dailyHours * weeklyDays;
    case 'month':
      return projectTime * monthlyHours;
    case 'hour':
    default:
      return projectTime;
  }
}

function renderExplanation(context, projectTime, projectUnitLabel, projectHours, projectPrices) {
  elements.logicExplanation.innerHTML = `
    <p>
      El ingreso mensual objetivo de <strong>${formatCurrency(context.desiredMonthlyIncome)}</strong> se distribuye entre
      <strong>${formatNumber(context.monthlyHours)}</strong> hora(s) disponibles al mes, calculadas con
      <strong>${formatNumber(context.dailyHours)}</strong> hora(s) efectivas al día,
      <strong>${formatNumber(context.weeklyDays)}</strong> día(s) activos por semana y un promedio de
      <strong>${formatNumber(WEEKS_PER_MONTH, 2)}</strong> semanas al mes.
    </p>
    <p>
      La división produce un valor base bruto que se <strong>redondea hacia arriba al siguiente múltiplo de $1.000</strong>,
      resultando en un valor base por hora de <strong>${formatCurrency(context.netHourlyValue)}</strong>.
      Este redondeo genera cifras más limpias, comerciales y fáciles de cotizar.
      Todos los cálculos siguientes parten de este valor ya redondeado.
    </p>
    <p>
      El valor base se multiplica por los multiplicadores definidos: mínimo
      <strong>${formatNumber(context.minimumFactor, 1)}</strong>, estándar
      <strong>${formatNumber(context.mediumFactor, 1)}</strong> y objetivo
      <strong>${formatNumber(context.idealFactor, 1)}</strong>. Cada resultado se redondea también
      hacia arriba al siguiente múltiplo de $1.000. Estos multiplicadores no son un recargo arbitrario:
      existen para elevar el valor base hasta reflejar la realidad de prestar un servicio profesional
      de forma independiente. El resultado: piso de cobro
      <strong>${formatCurrency(context.minimumHourlyRate)}</strong>,
      tarifa estándar <strong>${formatCurrency(context.mediumHourlyRate)}</strong> y
      tarifa objetivo <strong>${formatCurrency(context.idealHourlyRate)}</strong> por hora.
    </p>
    <p>
      Para el proyecto estimado en <strong>${formatNumber(projectTime)}</strong> ${projectUnitLabel}
      — equivalente a <strong>${formatNumber(projectHours)}</strong> hora(s) efectivas —
      los totales se calculan con las tarifas ya redondeadas y se redondean igualmente:
      precio piso <strong>${formatCurrency(projectPrices.minimum)}</strong>,
      precio estándar <strong>${formatCurrency(projectPrices.medium)}</strong> y
      precio objetivo <strong>${formatCurrency(projectPrices.ideal)}</strong>.
    </p>
  `;
}

function getProjectUnitLabel(unit, projectTime) {
  const isPlural = Number(projectTime) !== 1;

  if (unit === 'day') {
    return isPlural ? 'días' : 'día';
  }

  if (unit === 'week') {
    return isPlural ? 'semanas' : 'semana';
  }

  if (unit === 'month') {
    return isPlural ? 'meses' : 'mes';
  }

  return isPlural ? 'horas' : 'hora';
}

function updateCalculator() {
  const context = getHourlyContext();
  const projectTime = parsePositiveNumber(elements.projectEstimatedTime.value, 0.25);
  const projectHours = convertProjectTimeToHours(projectTime, elements.projectTimeUnit.value, context);
  // Los precios del proyecto usan tarifas ya redondeadas
  // y también se redondean hacia arriba de forma independiente
  const projectPrices = {
    minimum: ceilTo1000(projectHours * context.minimumHourlyRate),
    medium:  ceilTo1000(projectHours * context.mediumHourlyRate),
    ideal:   ceilTo1000(projectHours * context.idealHourlyRate),
  };

  elements.weeksPerMonth.value = WEEKS_PER_MONTH.toFixed(2);
  elements.monthlyHoursResult.textContent = `${formatNumber(context.monthlyHours)} h`;
  elements.netHourlyValueResult.textContent = formatCurrency(context.netHourlyValue);
  elements.minimumHourlyRateResult.textContent = formatCurrency(context.minimumHourlyRate);
  elements.mediumHourlyRateResult.textContent = formatCurrency(context.mediumHourlyRate);
  elements.idealHourlyRateResult.textContent = formatCurrency(context.idealHourlyRate);
  elements.projectHoursResult.textContent = `${formatNumber(projectHours)} h`;
  elements.projectMinimumPriceResult.textContent = formatCurrency(projectPrices.minimum);
  elements.projectMediumPriceResult.textContent = formatCurrency(projectPrices.medium);
  elements.projectIdealPriceResult.textContent = formatCurrency(projectPrices.ideal);

  renderExplanation(
    context,
    projectTime,
    getProjectUnitLabel(elements.projectTimeUnit.value, projectTime),
    projectHours,
    projectPrices,
  );
}

function hideTooltip() {
  elements.tooltip.classList.remove('is-visible');
  elements.tooltip.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.info-button.is-active').forEach((button) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-expanded', 'false');
  });
}

function showTooltip(button) {
  const tooltipText = button.dataset.tooltip;
  const rect = button.getBoundingClientRect();
  const tooltip = elements.tooltip;

  document.querySelectorAll('.info-button.is-active').forEach((activeButton) => {
    if (activeButton !== button) {
      activeButton.classList.remove('is-active');
      activeButton.setAttribute('aria-expanded', 'false');
    }
  });

  tooltip.textContent = tooltipText;
  tooltip.classList.add('is-visible');
  tooltip.setAttribute('aria-hidden', 'false');
  button.classList.add('is-active');
  button.setAttribute('aria-expanded', 'true');

  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const left = Math.min(window.innerWidth - tooltipWidth - 12, Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2));
  const top = Math.max(12, rect.top - tooltipHeight - 12);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function setupInfoButtons() {
  const infoButtons = document.querySelectorAll('.info-button');

  infoButtons.forEach((button) => {
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isActive = button.classList.contains('is-active');

      if (isActive) {
        hideTooltip();
        return;
      }

      showTooltip(button);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.tooltip')) {
      hideTooltip();
    }
  });

  window.addEventListener('resize', hideTooltip);
  window.addEventListener('scroll', hideTooltip, true);
}

function setupThemeToggle() {
  const savedTheme = localStorage.getItem('pricingCalculatorTheme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pricingCalculatorTheme', nextTheme);
  });
}

function setupEvents() {
  const watchedInputs = [
    elements.desiredMonthlyIncome,
    elements.dailyHours,
    elements.weeklyDays,
    elements.minimumFactor,
    elements.mediumFactor,
    elements.idealFactor,
    elements.projectEstimatedTime,
    elements.projectTimeUnit,
  ];

  watchedInputs.forEach((element) => {
    element.addEventListener('input', () => { updateCalculator(); saveFormState(); });
    element.addEventListener('change', () => { updateCalculator(); saveFormState(); });
  });

  elements.resetButton.addEventListener('click', resetFormState);
}

/**
 * Borra el estado guardado en localStorage, restablece los valores
 * por defecto en todos los campos y recalcula la interfaz.
 */
function resetFormState() {
  // Solo borra la clave de esta calculadora, sin afectar otros datos
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}

  // Valores por defecto
  elements.desiredMonthlyIncome.value = formatMonetaryInput(3000000);
  elements.dailyHours.value           = '4';
  elements.weeklyDays.value           = '5';
  elements.minimumFactor.value        = '1.5';
  elements.mediumFactor.value         = '1.7';
  elements.idealFactor.value          = '2.0';
  elements.projectEstimatedTime.value = '10';
  elements.projectTimeUnit.value      = 'hour';

  updateCalculator();
}

/**
 * Gestiona el ciclo de vida visual del campo de ingreso mensual (tipo text):
 * - Al enfocar: muestra el número limpio para editar fácilmente.
 * - Al salir:   aplica el formato visual completo.
 */
function setupMonetaryInput() {
  const input = elements.desiredMonthlyIncome;

  input.addEventListener('focus', () => {
    const n = parseMonetaryValue(input.value);
    input.value = n > 0 ? n.toString() : '';
    input.select();
  });

  input.addEventListener('blur', () => {
    const n = parseMonetaryValue(input.value);
    input.value = n > 0 ? formatMonetaryInput(n) : formatMonetaryInput(1);
    updateCalculator();
    saveFormState();
  });
}

/* ─── Persistencia con localStorage ─────────────────────────────────── */

/**
 * Lee el estado actual de todos los campos editables del formulario.
 * @returns {Object}
 */
function getFormState() {
  return {
    // Guarda el valor numérico limpio (sin formato) para portabilidad
    desiredMonthlyIncome: String(parseMonetaryValue(elements.desiredMonthlyIncome.value) || ''),
    dailyHours:           elements.dailyHours.value,
    weeklyDays:           elements.weeklyDays.value,
    minimumFactor:        elements.minimumFactor.value,
    mediumFactor:         elements.mediumFactor.value,
    idealFactor:          elements.idealFactor.value,
    projectEstimatedTime: elements.projectEstimatedTime.value,
    projectTimeUnit:      elements.projectTimeUnit.value,
  };
}

/**
 * Guarda el estado actual del formulario en localStorage.
 */
function saveFormState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormState()));
  } catch (_) {
    // localStorage no disponible (modo privado extremo, etc.)
  }
}

/**
 * Lee el estado guardado desde localStorage.
 * Devuelve null si no existe o si el JSON está corrupto.
 * @returns {Object|null}
 */
function loadFormState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Verificación mínima: el objeto debe tener al menos una clave esperada
    if (typeof state !== 'object' || state === null) return null;
    if (!('desiredMonthlyIncome' in state)) return null;
    return state;
  } catch (_) {
    return null;
  }
}

/**
 * Aplica un estado guardado a los campos del formulario.
 * Solo sobrescribe el campo si el valor guardado es un string no vacío.
 * @param {Object} state
 */
function applyFormState(state) {
  const fieldMap = [
    ['dailyHours',           elements.dailyHours],
    ['weeklyDays',           elements.weeklyDays],
    ['minimumFactor',        elements.minimumFactor],
    ['mediumFactor',         elements.mediumFactor],
    ['idealFactor',          elements.idealFactor],
    ['projectEstimatedTime', elements.projectEstimatedTime],
    ['projectTimeUnit',      elements.projectTimeUnit],
  ];

  fieldMap.forEach(([key, el]) => {
    if (state[key] !== undefined && state[key] !== '') {
      el.value = state[key];
    }
  });

  // El campo monetario requiere formato visual al restaurar
  if (state.desiredMonthlyIncome) {
    const n = parseMonetaryValue(state.desiredMonthlyIncome);
    if (n > 0) elements.desiredMonthlyIncome.value = formatMonetaryInput(n);
  }
}

setupInfoButtons();
setupThemeToggle();
setupEvents();
setupMonetaryInput();

// Restaurar estado guardado (si existe) y recalcular
const savedState = loadFormState();
if (savedState) {
  applyFormState(savedState);
} else {
  // Primera carga: aplicar formato visual al valor por defecto del HTML
  const defaultN = parseMonetaryValue(elements.desiredMonthlyIncome.value);
  if (defaultN > 0) elements.desiredMonthlyIncome.value = formatMonetaryInput(defaultN);
}
updateCalculator();
