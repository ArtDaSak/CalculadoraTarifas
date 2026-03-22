const WEEKS_PER_MONTH = 4.33;
const MIN_FACTOR = 1.5;
const STORAGE_KEY  = 'artdasak_tarifas_state';
const CONFIG_KEY   = 'artdasak_tarifas_config';

/* ─── Sistema de monedas ─────────────────────────────────────────────── */

const CURRENCIES = {
  COP: { code: 'COP', name: 'Peso colombiano',       roundingUnit: 1000, defaultIncome: 3000000, symbol: '$'   },
  USD: { code: 'USD', name: 'D\u00f3lar estadounidense', roundingUnit: 1,    defaultIncome: 2500,    symbol: '$'   },
  EUR: { code: 'EUR', name: 'Euro',                  roundingUnit: 1,    defaultIncome: 2000,    symbol: '€'   },
  MXN: { code: 'MXN', name: 'Peso mexicano',         roundingUnit: 10,   defaultIncome: 25000,   symbol: '$'   },
  GBP: { code: 'GBP', name: 'Libra esterlina',       roundingUnit: 1,    defaultIncome: 1800,    symbol: '£'   },
  ARS: { code: 'ARS', name: 'Peso argentino',        roundingUnit: 1000, defaultIncome: 1500000, symbol: '$'   },
  CLP: { code: 'CLP', name: 'Peso chileno',          roundingUnit: 1000, defaultIncome: 1200000, symbol: '$'   },
  BRL: { code: 'BRL', name: 'Real brasile\u00f1o',   roundingUnit: 10,   defaultIncome: 5000,    symbol: 'R$'  },
  PEN: { code: 'PEN', name: 'Sol peruano',           roundingUnit: 10,   defaultIncome: 3000,    symbol: 'S/'  },
  CAD: { code: 'CAD', name: 'D\u00f3lar canadiense', roundingUnit: 1,    defaultIncome: 3000,    symbol: '$'   },
  AUD: { code: 'AUD', name: 'D\u00f3lar australiano',roundingUnit: 1,    defaultIncome: 3500,    symbol: '$'   },
  UYU: { code: 'UYU', name: 'Peso uruguayo',         roundingUnit: 100,  defaultIncome: 50000,   symbol: '$U'  },
  JPY: { code: 'JPY', name: 'Yen japon\u00e9s',      roundingUnit: 100,  defaultIncome: 300000,  symbol: '¥'   },
  CNY: { code: 'CNY', name: 'Yuan chino',            roundingUnit: 10,   defaultIncome: 15000,   symbol: 'CN¥' },
  CHF: { code: 'CHF', name: 'Franco suizo',          roundingUnit: 1,    defaultIncome: 4500,    symbol: ''    },
};

// Mapeo de locale (navigator.language) → código de moneda
const LOCALE_CURRENCY_MAP = {
  'es-CO':'COP','es-MX':'MXN','en-US':'USD','en-CA':'CAD',
  'es-ES':'EUR','de-DE':'EUR','fr-FR':'EUR','it-IT':'EUR',
  'pt-PT':'EUR','en-GB':'GBP','es-AR':'ARS','es-CL':'CLP',
  'pt-BR':'BRL','es-PE':'PEN','es-UY':'UYU','es':'USD',
  'en':'USD','de':'EUR','fr':'EUR','pt':'BRL',
};

// Mapeo de código de país (ISO 3166-1 alpha-2) → código de moneda
const COUNTRY_CURRENCY_MAP = {
  CO:'COP',MX:'MXN',US:'USD',CA:'CAD',ES:'EUR',DE:'EUR',
  FR:'EUR',IT:'EUR',GB:'GBP',AR:'ARS',CL:'CLP',BR:'BRL',
  PE:'PEN',UY:'UYU',AU:'AUD',JP:'JPY',EC:'USD',PA:'USD',
  GT:'USD',HN:'USD',SV:'USD',CR:'USD',DO:'USD',VE:'USD',
};

// Estado de configuración activa
let appConfig = {
  currency: 'COP',
  roundingEnabled: true,
};

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
  // Controles de moneda / aproximaciones
  roundingToggle: document.getElementById('roundingToggle'),
  currencyButton: document.getElementById('currencyButton'),
  currencyButtonLabel: document.getElementById('currencyButtonLabel'),
  currencyPopover: document.getElementById('currencyPopover'),
  currencyList: document.getElementById('currencyList'),
  // Onboarding
  onboardingOverlay: document.getElementById('onboardingOverlay'),
  onboardingSuggest: document.getElementById('onboardingSuggest'),
  onboardingSelect: document.getElementById('onboardingSelect'),
  onboardingGeoBtn: document.getElementById('onboardingGeoBtn'),
  onboardingGeoBtnLabel: document.getElementById('onboardingGeoBtnLabel'),
  onboardingConfirm: document.getElementById('onboardingConfirm'),
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

function buildMonetaryString(n) {
  const c = CURRENCIES[appConfig.currency] || { symbol: '$', code: appConfig.currency };
  const formattedNum = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); // Non-breaking space
  
  if (c.symbol) {
    return `${c.symbol}\u00A0${formattedNum} ${c.code}`;
  }
  return `${c.code}\u00A0${formattedNum}`;
}

function buildMonetaryHTML(n) {
  const c = CURRENCIES[appConfig.currency] || { symbol: '$', code: appConfig.currency };
  const formattedNum = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  
  if (c.symbol) {
    return `<span class="currency-symbol">${c.symbol}</span>\u00A0<span class="currency-number">${formattedNum}</span> <span class="currency-iso">${c.code}</span>`;
  }
  return `<span class="currency-iso-primary">${c.code}</span>\u00A0<span class="currency-number">${formattedNum}</span>`;
}

/**
 * Formatea un número como valor monetario para mostrar en inputs y displays.
 * Usa el formato Símbolo + Valor + Código ISO.
 */
function formatMonetaryInput(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return '';
  return buildMonetaryString(n);
}

/**
 * Formatea un valor numérico como moneda para los resultados.
 * Usa el formato Símbolo + Valor + Código ISO sin HTML (útil como fallback).
 */
function formatCurrency(value) {
  const n = Math.round(value);
  if (!Number.isFinite(n)) return buildMonetaryString(0);
  return buildMonetaryString(n);
}

/**
 * Formatea un valor numérico como HTML, introduciendo jerarquía visual 
 * para el símbolo, el número y el código ISO.
 */
function formatCurrencyHTML(value) {
  const n = Math.round(value);
  if (!Number.isFinite(n)) return buildMonetaryHTML(0);
  return buildMonetaryHTML(n);
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Redondea hacia arriba a la siguiente unidad comercial de la moneda activa.
 * Si las aproximaciones están desactivadas, devuelve el valor exacto.
 * La unidad depende de la moneda: COP/ARS/CLP=1000, MXN/BRL/PEN=10, USD/EUR/GBP=1, etc.
 */
function ceilToUnit(value) {
  if (!appConfig.roundingEnabled) return value;
  const unit = CURRENCIES[appConfig.currency]?.roundingUnit ?? 1;
  return Math.ceil(value / unit) * unit;
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

  // Valor base redondeado a la unidad de la moneda activa
  const netHourlyValueRaw = desiredMonthlyIncome / monthlyHours;
  const netHourlyValue = ceilToUnit(netHourlyValueRaw);

  // Las tarifas se calculan desde el valor base ya redondeado
  // y también se redondean de forma independiente
  const minimumHourlyRate = ceilToUnit(netHourlyValue * minimumFactor);
  const mediumHourlyRate  = ceilToUnit(netHourlyValue * mediumFactor);
  const idealHourlyRate   = ceilToUnit(netHourlyValue * idealFactor);

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
  const c = CURRENCIES[appConfig.currency] || { symbol: '$', roundingUnit: 1, code: appConfig.currency };
  const roundingUnitValue = buildMonetaryString(c.roundingUnit); // ej "$ 1000 COP"

  const textPart1 = appConfig.roundingEnabled
    ? `se <strong>redondea hacia arriba al siguiente múltiplo de ${roundingUnitValue}</strong>,
       resultando en un valor base por hora de <strong>${formatCurrencyHTML(context.netHourlyValue)}</strong>.
       Este redondeo genera cifras más limpias, comerciales y fáciles de cotizar.`
    : `<strong>no sufre ninguna aproximación comercial</strong>, resultando en un valor base por hora exacto de
       <strong>${formatCurrencyHTML(context.netHourlyValue)}</strong>.`;

  const textPart2 = appConfig.roundingEnabled
    ? `Cada resultado se redondea también hacia arriba al siguiente múltiplo de ${roundingUnitValue}.`
    : `Todos los cálculos se manejan con su valor exacto sin aproximaciones comerciales.`;

  const textPart3 = appConfig.roundingEnabled
    ? `se calculan con las tarifas ya redondeadas y se redondean igualmente:`
    : `(sin aproximaciones extra):`;

  elements.logicExplanation.innerHTML = `
    <p>
      El ingreso mensual objetivo de <strong>${formatCurrency(context.desiredMonthlyIncome)}</strong> se distribuye entre
      <strong>${formatNumber(context.monthlyHours)}</strong> hora(s) disponibles al mes, calculadas con
      <strong>${formatNumber(context.dailyHours)}</strong> hora(s) efectivas al día,
      <strong>${formatNumber(context.weeklyDays)}</strong> día(s) activos por semana y un promedio de
      <strong>${formatNumber(WEEKS_PER_MONTH, 2)}</strong> semanas al mes.
    </p>
    <p>
      La división produce un valor base bruto que ${textPart1}
      Todos los cálculos siguientes parten de este valor.
    </p>
    <p>
      El valor base se multiplica por los multiplicadores definidos: mínimo
      <strong>${formatNumber(context.minimumFactor, 1)}</strong>, estándar
      <strong>${formatNumber(context.mediumFactor, 1)}</strong> y objetivo
      <strong>${formatNumber(context.idealFactor, 1)}</strong>. ${textPart2} Estos multiplicadores no son un recargo arbitrario:
      existen para elevar el valor base hasta reflejar la realidad de prestar un servicio profesional
      de forma independiente. El resultado: piso de cobro
      <strong>${formatCurrencyHTML(context.minimumHourlyRate)}</strong>,
      tarifa estándar <strong>${formatCurrencyHTML(context.mediumHourlyRate)}</strong> y
      tarifa objetivo <strong>${formatCurrencyHTML(context.idealHourlyRate)}</strong> por hora.
    </p>
    <p>
      Para el proyecto estimado en <strong>${formatNumber(projectTime)}</strong> ${projectUnitLabel}
      — equivalente a <strong>${formatNumber(projectHours)}</strong> hora(s) efectivas —
      los totales ${textPart3}
      precio piso <strong>${formatCurrencyHTML(projectPrices.minimum)}</strong>,
      precio estándar <strong>${formatCurrencyHTML(projectPrices.medium)}</strong> y
      precio objetivo <strong>${formatCurrencyHTML(projectPrices.ideal)}</strong>.
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
    minimum: ceilToUnit(projectHours * context.minimumHourlyRate),
    medium:  ceilToUnit(projectHours * context.mediumHourlyRate),
    ideal:   ceilToUnit(projectHours * context.idealHourlyRate),
  };

  elements.weeksPerMonth.value = WEEKS_PER_MONTH.toFixed(2);
  elements.weeksPerMonth.value = WEEKS_PER_MONTH.toFixed(2);
  elements.monthlyHoursResult.innerHTML = `<span class="currency-number">${formatNumber(context.monthlyHours)}</span> <span class="currency-iso">h</span>`;
  elements.netHourlyValueResult.innerHTML = formatCurrencyHTML(context.netHourlyValue);
  elements.minimumHourlyRateResult.innerHTML = formatCurrencyHTML(context.minimumHourlyRate);
  elements.mediumHourlyRateResult.innerHTML = formatCurrencyHTML(context.mediumHourlyRate);
  elements.idealHourlyRateResult.innerHTML = formatCurrencyHTML(context.idealHourlyRate);
  elements.projectHoursResult.innerHTML = `<span class="currency-number">${formatNumber(projectHours)}</span> <span class="currency-iso">h</span>`;
  elements.projectMinimumPriceResult.innerHTML = formatCurrencyHTML(projectPrices.minimum);
  elements.projectMediumPriceResult.innerHTML = formatCurrencyHTML(projectPrices.medium);
  elements.projectIdealPriceResult.innerHTML = formatCurrencyHTML(projectPrices.ideal);

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

  const c = CURRENCIES[appConfig.currency] || CURRENCIES['COP'];

  // Valores por defecto
  elements.desiredMonthlyIncome.value = formatMonetaryInput(c.defaultIncome);
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

/* ─── Configuración de moneda y aproximaciones ──────────────────────── */

/**
 * Infiere la moneda sugerida desde navigator.language.
 * Primero busca coincidencia exacta de locale, luego por idioma base.
 * @returns {string} Código de moneda (ej. 'COP')
 */
function inferCurrencyFromLocale() {
  const lang = navigator.language || 'es-CO';
  if (LOCALE_CURRENCY_MAP[lang]) return LOCALE_CURRENCY_MAP[lang];
  const base = lang.split('-')[0];
  return LOCALE_CURRENCY_MAP[base] || 'COP';
}

/**
 * Carga la configuración guardada en localStorage.
 * Si no existe o está corrupta, devuelve null.
 */
function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg || typeof cfg !== 'object') return null;
    if (!('currency' in cfg)) return null;
    return cfg;
  } catch (_) {
    return null;
  }
}

/**
 * Guarda la configuración actual en localStorage.
 */
function saveConfig() {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(appConfig));
  } catch (_) {}
}

/**
 * Aplica la moneda activa a toda la interfaz:
 * - actualiza el botón de moneda en el topbar
 * - recalcula con la nueva moneda
 * @param {boolean} applyDefault Si es true, sobreescribe el ingreso deseado con el predeterminado de la moneda
 */
function applyActiveCurrency(applyDefault = false) {
  const code = appConfig.currency;
  // Actualiza el label del botón de moneda
  if (elements.currencyButtonLabel) {
    elements.currencyButtonLabel.textContent = code;
  }
  // Actualiza el estado visual del toggle de aproximaciones
  if (elements.roundingToggle) {
    elements.roundingToggle.classList.toggle('is-active', appConfig.roundingEnabled);
    elements.roundingToggle.setAttribute('aria-pressed', appConfig.roundingEnabled);
  }

  // Si se solicita, aplica el valor sugerido inicial para la moneda; si no, solo cambia el formato
  if (applyDefault && CURRENCIES[code]) {
    elements.desiredMonthlyIncome.value = formatMonetaryInput(CURRENCIES[code].defaultIncome);
  } else {
    // Reformatea el campo de ingreso mensual con el nuevo prefijo
    const currentIncome = parseMonetaryValue(elements.desiredMonthlyIncome.value);
    if (currentIncome > 0) {
      elements.desiredMonthlyIncome.value = formatMonetaryInput(currentIncome);
    }
  }
  
  updateCalculator();
}

/**
 * Gestiona el selector de moneda en el topbar:
 * - botón de moneda abre/cierra el popover
 * - códigos de moneda en el listado disparan el cambio
 * - toggle de aproximaciones activa/desactiva el rounding
 */
function setupCurrencyControls() {
  if (!elements.currencyButton || !elements.roundingToggle) return;

  const autodetectBtn = `
    <button class="currency-option" type="button" data-action="autodetect">
      <span class="currency-option-code" style="display: flex; align-items: center;">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/><path d="M7 5H3"/>
        </svg>
      </span>
      <span class="currency-option-name" style="color: var(--primary);">Autodetectar</span>
    </button>
  `;
  const currenciesBtns = Object.values(CURRENCIES)
    .map(c => `<button class="currency-option${appConfig.currency === c.code ? ' is-selected' : ''}"
        type="button" data-code="${c.code}">
      <span class="currency-option-code">${c.code}</span>
      <span class="currency-option-name">${c.name}</span>
    </button>`)
    .join('');
    
  elements.currencyList.innerHTML = autodetectBtn + currenciesBtns;

  // Abrir / cerrar popover
  elements.currencyButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = elements.currencyPopover.classList.toggle('is-open');
    elements.currencyButton.setAttribute('aria-expanded', open);
  });

  // Elegir moneda desde el listado
  elements.currencyList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    if (btn.dataset.action === 'autodetect') {
      elements.currencyPopover.classList.remove('is-open');
      elements.currencyButton.setAttribute('aria-expanded', 'false');
      setupOnboarding(true); // reopen onboarding
      return;
    }
    
    if (btn.dataset.code) {
      appConfig.currency = btn.dataset.code;
      saveConfig();
      // Marcar seleccionado
      elements.currencyList.querySelectorAll('.currency-option').forEach(el => {
        el.classList.toggle('is-selected', el.dataset.code === appConfig.currency);
      });
      elements.currencyPopover.classList.remove('is-open');
      elements.currencyButton.setAttribute('aria-expanded', 'false');
      applyActiveCurrency(true);
    }
  });

  // Cerrar popover al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!elements.currencyButton.contains(e.target) && !elements.currencyPopover.contains(e.target)) {
      elements.currencyPopover.classList.remove('is-open');
      elements.currencyButton.setAttribute('aria-expanded', 'false');
    }
  });

  // Toggle de aproximaciones
  elements.roundingToggle.addEventListener('click', () => {
    appConfig.roundingEnabled = !appConfig.roundingEnabled;
    saveConfig();
    applyActiveCurrency();
  });
}

/**
 * Solicita geolocalización opcional al usuario.
 * Si se concede permiso, usa nominatim para obtener el país
 * y actualiza la moneda sugerida en el onboarding.
 * @param {Function} onResult Callback con el código de moneda encontrado
 */
async function requestGeolocation(onResult) {
  if (!navigator.geolocation) {
    onResult(null);
    return;
  }
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    );
    const { latitude: lat, longitude: lon } = pos.coords;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const countryCode = (data.address?.country_code || '').toUpperCase();
    const currency = COUNTRY_CURRENCY_MAP[countryCode] || null;
    onResult(currency);
  } catch (_) {
    onResult(null);
  }
}

/**
 * Gestiona la pantalla de onboarding de primera carga.
 * Si forceShow es true, ignora localStorage y se vuelve a abrir (por el botón Autodetectar).
 */
function setupOnboarding(forceShow = false) {
  if (!elements.onboardingOverlay) return;

  if (!forceShow) {
    const savedCfg = loadConfig();
    if (savedCfg) {
      // Ya tiene configuración: aplicar y ocultar onboarding
      appConfig = { ...appConfig, ...savedCfg };
      elements.onboardingOverlay.style.display = 'none';
      return;
    }
  } else {
    // Si la forzamos a mostrar, nos aseguramos de quitar cualquier animación previa
    elements.onboardingOverlay.classList.remove('is-closing');
  }

  // Primera visita: inferir moneda por locale y mostrar onboarding
  const suggested = inferCurrencyFromLocale();
  appConfig.currency = suggested;

  // Mostrar moneda sugerida
  if (elements.onboardingSuggest) {
    const currency = CURRENCIES[suggested];
    elements.onboardingSuggest.textContent =
      `Detectamos ${currency?.name || suggested} (${suggested}) como tu moneda probable.`;
  }

  // Poblar select manual
  if (elements.onboardingSelect) {
    elements.onboardingSelect.innerHTML = Object.values(CURRENCIES)
      .map(c => `<option value="${c.code}"${ c.code === suggested ? ' selected' : ''}>${c.code} — ${c.name}</option>`)
      .join('');

    if (!elements.onboardingSelect.dataset.bound) {
      elements.onboardingSelect.dataset.bound = "true";
      elements.onboardingSelect.addEventListener('change', () => {
        appConfig.currency = elements.onboardingSelect.value;
      });
    }
  }

  // Botón de geolocalización
  if (elements.onboardingGeoBtn && !elements.onboardingGeoBtn.dataset.bound) {
    elements.onboardingGeoBtn.dataset.bound = "true";
    elements.onboardingGeoBtn.addEventListener('click', async () => {
      elements.onboardingGeoBtnLabel.textContent = 'Detectando...';
      elements.onboardingGeoBtn.disabled = true;
      await requestGeolocation((code) => {
        if (code && CURRENCIES[code]) {
          appConfig.currency = code;
          if (elements.onboardingSelect) elements.onboardingSelect.value = code;
          if (elements.onboardingSuggest) {
            elements.onboardingSuggest.textContent =
              `Ubicación detectada: ${CURRENCIES[code].name} (${code})`;
          }
        } else {
          if (elements.onboardingSuggest)
            elements.onboardingSuggest.textContent = 'No se pudo detectar la ubicación. Elige manualmente.';
        }
        elements.onboardingGeoBtnLabel.textContent = 'Usar mi ubicación';
        elements.onboardingGeoBtn.disabled = false;
      });
    });
  }

  // Confirmar y cerrar
  if (elements.onboardingConfirm && !elements.onboardingConfirm.dataset.bound) {
    elements.onboardingConfirm.dataset.bound = "true";
    elements.onboardingConfirm.addEventListener('click', () => {
      // Si el select fue modificado a mano, sincronizar
      if (elements.onboardingSelect) {
        appConfig.currency = elements.onboardingSelect.value;
      }
      saveConfig();
      // Ocultar overlay con animación
      elements.onboardingOverlay.classList.add('is-closing');
      setTimeout(() => {
        elements.onboardingOverlay.style.display = 'none';
        applyActiveCurrency(true);
      }, 350);
    });
  }

  // Cerrar al hacer clic fuera (solo si ya existe configuración, es decir, no es onboarding forzado en 1ra visita)
  if (!elements.onboardingOverlay.dataset.backdropBound) {
    elements.onboardingOverlay.dataset.backdropBound = "true";
    elements.onboardingOverlay.addEventListener('click', (e) => {
      if (e.target === elements.onboardingOverlay && loadConfig()) {
        elements.onboardingOverlay.classList.add('is-closing');
        setTimeout(() => {
          elements.onboardingOverlay.style.display = 'none';
        }, 350);
      }
    });
  }

  // Mostrar overlay
  elements.onboardingOverlay.style.display = 'flex';
}


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
setupOnboarding();
setupCurrencyControls();

// Restaurar estado guardado (si existe) y recalcular
const savedState = loadFormState();
if (savedState) {
  applyFormState(savedState);
} else {
  // Primera carga: aplicar formato visual al valor por defecto del HTML
  const defaultN = parseMonetaryValue(elements.desiredMonthlyIncome.value);
  if (defaultN > 0) elements.desiredMonthlyIncome.value = formatMonetaryInput(defaultN);
}
applyActiveCurrency();
