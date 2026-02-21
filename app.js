const ROLES = [
  { id: 'leading', label: 'Ведущий' },
  { id: 'backing', label: 'Бэк', multi: 3, default: 'все' },
  { id: 'piano', label: 'Фоно' },
  { id: 'drums', label: 'Барабаны', default: 'Вова' },
  { id: 'guitar', label: 'Гитара' },
  { id: 'bass', label: 'Бас' }
];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const STORAGE_KEYS = {
  participants: 'grafyk_participants',
  schedule: 'grafyk_schedule',
  lastMonth: 'grafyk_lastMonth'
};

const DEFAULT_PARTICIPANTS = [
  'Андрей', 'Алёна', 'Вова', 'Вениамин', 'Таня', 'Эвелина',
  'Элла', 'Алеся', 'Настя', 'Ира', 'Татьяна'
];

let currentDate = new Date();
let participants = loadParticipants();
let schedule = loadSchedule();

function loadParticipants() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.participants);
    if (saved) {
      const arr = JSON.parse(saved);
      return Array.isArray(arr) && arr.length > 0 ? arr : [...DEFAULT_PARTICIPANTS];
    }
  } catch (_) {}
  return [...DEFAULT_PARTICIPANTS];
}

function saveParticipants() {
  localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(participants));
}

function loadSchedule() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.schedule);
    if (saved) {
      const data = JSON.parse(saved);
      return data && typeof data === 'object' ? data : {};
    }
  } catch (_) {}
  return {};
}

function saveSchedule() {
  localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule));
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getServiceDates(year, month) {
  const dates = [];
  const d = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  while (d <= lastDay) {
    const day = d.getDay();
    if (day === 0 || day === 2) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  return dates.sort((a, b) => a - b);
}

function filterFutureDates(dates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dates.filter(d => {
    const dCopy = new Date(d);
    dCopy.setHours(0, 0, 0, 0);
    return dCopy >= today;
  });
}

function splitByDayOfWeek(dates) {
  const sundays = dates.filter(d => d.getDay() === 0);
  const tuesdays = dates.filter(d => d.getDay() === 2);
  return { sundays, tuesdays };
}

function getAssignment(dateKey, roleId) {
  const val = schedule[dateKey]?.[roleId];
  if (roleId === 'backing' && typeof val === 'string' && !val.includes(',')) {
    return val ? [val] : [];
  }
  return val ?? null;
}

function setAssignment(dateKey, roleId, value, index) {
  if (!schedule[dateKey]) schedule[dateKey] = {};
  if (roleId === 'backing' && typeof index === 'number' && index >= 0 && index < 3) {
    let arr = Array.isArray(schedule[dateKey][roleId]) ? [...schedule[dateKey][roleId]] : [];
    if (typeof schedule[dateKey][roleId] === 'string') arr = [schedule[dateKey][roleId]];
    while (arr.length < 3) arr.push('');
    arr[index] = value || '';
    schedule[dateKey][roleId] = arr;
  } else if (roleId !== 'backing') {
    schedule[dateKey][roleId] = value || null;
  }
  saveSchedule();
}

function getOptionsForRole(role, dateKey) {
  const def = role.default;
  const assigned = getAssignment(dateKey, role.id);
  let baseOpts = participants.slice();
  if (assigned) {
    const arr = Array.isArray(assigned) ? assigned : [assigned];
    arr.forEach(a => { if (a && !baseOpts.includes(a) && a !== def) baseOpts.push(a); });
  } else if (assigned && !Array.isArray(assigned) && !baseOpts.includes(assigned) && assigned !== def) {
    baseOpts.push(assigned);
  }
  baseOpts.sort();
  if (def && role.id !== 'backing') {
    baseOpts = baseOpts.filter(p => p !== def);
    return `<option value="${escapeHtml(def)}">${escapeHtml(def)}</option>${baseOpts.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`;
  }
  return baseOpts.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

function renderDateBlock(date) {
  const key = getDateKey(date);
  const dateNum = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[currentDate.getMonth()];
  const blockClass = date.getDay() === 0 ? 'date-block sunday' : 'date-block tuesday';

  const roleRows = ROLES.map(role => {
    if (role.multi === 3 && role.id === 'backing') {
      const arr = getAssignment(key, 'backing');
      const vals = Array.isArray(arr) ? arr : [arr || ''];
      const sel = (i) => `<option value="">—</option><option value="все">все</option>${participants.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`;
      const cells = [0, 1, 2].map(i => `
        <select data-date="${key}" data-role="backing" data-index="${i}">
          ${sel(i)}
        </select>
      `).join('');
      return `
        <div class="role-row role-row-multi">
          <span class="role-label">${role.label}:</span>
          <div class="backing-selects">${cells}</div>
        </div>
      `;
    }
    const def = role.default;
    const optionsList = getOptionsForRole(role, key);
    return `
      <div class="role-row">
        <span class="role-label">${role.label}:</span>
        <select data-date="${key}" data-role="${role.id}">
          ${!def ? '<option value="">—</option>' : ''}
          ${optionsList}
        </select>
      </div>
    `;
  }).join('');

  return `
    <div class="${blockClass}">
      <div class="date-header">${dateNum} ${month} <span class="day-name">${dayName}</span></div>
      <div class="roles-list">${roleRows}</div>
    </div>
  `;
}

function renderBlocksGrid(dates) {
  return dates.map(date => renderDateBlock(date)).join('');
}

function bindSelects(container) {
  if (!container) return;
  container.querySelectorAll('select').forEach(sel => {
    const key = sel.dataset.date;
    const roleId = sel.dataset.role;
    const hasIndex = sel.hasAttribute('data-index');
    const index = hasIndex ? parseInt(sel.dataset.index, 10) : -1;
    const role = ROLES.find(r => r.id === roleId);
    let val;
    if (roleId === 'backing' && hasIndex && index >= 0) {
      const arr = getAssignment(key, 'backing');
      val = Array.isArray(arr) && arr[index] !== undefined ? arr[index] : '';
    } else {
      val = getAssignment(key, roleId);
      if (val == null && role) val = role.default || '';
    }
    try {
      sel.value = val || '';
    } catch (_) {}
    sel.addEventListener('change', () => {
      if (roleId === 'backing' && hasIndex && index >= 0) {
        setAssignment(key, roleId, sel.value || null, index);
      } else {
        setAssignment(key, roleId, sel.value || null);
      }
    });
  });
}

function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById('currentMonth').textContent = `${MONTH_NAMES[month]} ${year}`;

  const allDates = getServiceDates(year, month);
  const dates = filterFutureDates(allDates);
  const container = document.getElementById('scheduleContent');

  if (dates.length === 0) {
    container.innerHTML = '<p class="empty-hint">Нет предстоящих служений в этом месяце</p>';
    return;
  }

  container.innerHTML = `<div class="blocks-grid">${renderBlocksGrid(dates)}</div>`;
  bindSelects(container);
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderParticipantsModal() {
  const list = document.getElementById('participantsList');
  list.innerHTML = participants.map(name => `
    <li>
      <span>${name}</span>
      <button type="button" class="delete-btn" data-name="${name}" aria-label="Удалить">×</button>
    </li>
  `).join('');

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      participants = participants.filter(p => p !== name);
      saveParticipants();
      renderParticipantsModal();
      renderMonth();
    });
  });
}

function init() {
  try {
    const savedMonth = localStorage.getItem(STORAGE_KEYS.lastMonth);
    if (savedMonth) {
      const parts = savedMonth.split('-').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        currentDate = new Date(parts[0], parts[1] - 1, 1);
      }
    }

    const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    localStorage.setItem(STORAGE_KEYS.lastMonth, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
    renderMonth();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    localStorage.setItem(STORAGE_KEYS.lastMonth, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
    renderMonth();
  });

  const manageBtn = document.getElementById('manageParticipants');
  if (manageBtn) manageBtn.addEventListener('click', () => {
    document.getElementById('participantsModal').classList.add('is-open');
    renderParticipantsModal();
  });
  const closeBtn = document.getElementById('closeParticipants');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    document.getElementById('participantsModal').classList.remove('is-open');
  });
  const modal = document.getElementById('participantsModal');
  if (modal) modal.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('is-open');
    }
  });

  const addBtn = document.getElementById('addParticipant');
  const input = document.getElementById('newParticipant');
  if (addBtn) addBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name || participants.includes(name)) return;
    participants.push(name);
    participants.sort();
    saveParticipants();
    input.value = '';
    renderParticipantsModal();
    renderMonth();
  });
  if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && addBtn) addBtn.click();
  });

  renderMonth();
  } catch (e) {
    console.error('Init error:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
