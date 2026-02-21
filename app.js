const ROLES = [
  { id: 'leading', label: 'Ведущий' },
  { id: 'backing', label: 'Бэк-вокал', default: 'все' },
  { id: 'piano', label: 'Фоно' },
  { id: 'drums', label: 'Барабаны', default: 'Вова' },
  { id: 'guitar', label: 'Гитара' }
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
    if (saved) return JSON.parse(saved);
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

function splitByDayOfWeek(dates) {
  const sundays = dates.filter(d => d.getDay() === 0);
  const tuesdays = dates.filter(d => d.getDay() === 2);
  return { sundays, tuesdays };
}

function getAssignment(dateKey, roleId) {
  return schedule[dateKey]?.[roleId] ?? null;
}

function setAssignment(dateKey, roleId, value) {
  if (!schedule[dateKey]) schedule[dateKey] = {};
  schedule[dateKey][roleId] = value || null;
  saveSchedule();
}

function getOptionsForRole(role, dateKey) {
  const def = role.default;
  const assigned = getAssignment(dateKey, role.id);
  let baseOpts = participants.slice();
  if (assigned && !baseOpts.includes(assigned) && assigned !== def) {
    baseOpts.push(assigned);
    baseOpts.sort();
  }
  if (def) {
    baseOpts = baseOpts.filter(p => p !== def);
    return `<option value="${escapeHtml(def)}">${escapeHtml(def)}</option>${baseOpts.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`;
  }
  return baseOpts.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

function renderMonthTable(dates) {
  const month = currentDate.getMonth();
  const headerCells = dates.map(date => {
    const dateNum = date.getDate();
    const dayName = DAY_NAMES[date.getDay()];
    const colClass = date.getDay() === 0 ? 'col-sunday' : 'col-tuesday';
    return `<th class="col-date ${colClass}"><span class="date-num">${dateNum}</span> <span class="day-name">${dayName}</span></th>`;
  }).join('');

  const roleRows = ROLES.map(role => {
    const def = role.default;
    const cells = dates.map(date => {
      const key = getDateKey(date);
      const colClass = date.getDay() === 0 ? 'col-sunday' : 'col-tuesday';
      const optionsList = getOptionsForRole(role, key);
      return `
        <td class="${colClass}">
          <select data-date="${key}" data-role="${role.id}">
            ${!def ? '<option value="">—</option>' : ''}
            ${optionsList}
          </select>
        </td>
      `;
    }).join('');
    return `<tr><th class="col-role">${role.label}</th>${cells}</tr>`;
  }).join('');

  return `
    <thead><tr><th class="col-role"></th>${headerCells}</tr></thead>
    <tbody>${roleRows}</tbody>
  `;
}

function bindSelects(container) {
  container.querySelectorAll('select').forEach(sel => {
    const key = sel.dataset.date;
    const roleId = sel.dataset.role;
    const role = ROLES.find(r => r.id === roleId);
    const val = getAssignment(key, roleId) ?? role?.default ?? '';
    sel.value = val || '';
    sel.addEventListener('change', () => setAssignment(key, roleId, sel.value || null));
  });
}

function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById('currentMonth').textContent = `${MONTH_NAMES[month]} ${year}`;

  const dates = getServiceDates(year, month);
  const container = document.getElementById('scheduleContent');

  if (dates.length === 0) {
    container.innerHTML = '<p class="empty-hint">В этом месяце нет служений</p>';
    return;
  }

  container.innerHTML = `
    <div class="schedule-table-wrap">
      <table class="schedule-table schedule-cols">
        ${renderMonthTable(dates)}
      </table>
    </div>
  `;
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
  const savedMonth = localStorage.getItem(STORAGE_KEYS.lastMonth);
  if (savedMonth) {
    const [y, m] = savedMonth.split('-').map(Number);
    currentDate = new Date(y, m - 1, 1);
  }

  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    localStorage.setItem(STORAGE_KEYS.lastMonth, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
    renderMonth();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    localStorage.setItem(STORAGE_KEYS.lastMonth, `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
    renderMonth();
  });

  document.getElementById('manageParticipants').addEventListener('click', () => {
    document.getElementById('participantsModal').classList.add('is-open');
    renderParticipantsModal();
  });

  document.getElementById('closeParticipants').addEventListener('click', () => {
    document.getElementById('participantsModal').classList.remove('is-open');
  });

  document.getElementById('participantsModal').addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('is-open');
    }
  });

  const addBtn = document.getElementById('addParticipant');
  const input = document.getElementById('newParticipant');

  addBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name || participants.includes(name)) return;
    participants.push(name);
    participants.sort();
    saveParticipants();
    input.value = '';
    renderParticipantsModal();
    renderMonth();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addBtn.click();
  });

  renderMonth();
}

init();
