const ROLES = [
  { id: 'leading', label: 'Ведущий' },
  { id: 'backing', label: 'Бэк-вокал', default: 'все' },
  { id: 'piano', label: 'Фоно' },
  { id: 'drums', label: 'Барабаны' },
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

function renderDateRows(dates) {
  const month = currentDate.getMonth();
  return dates.map(date => {
    const key = getDateKey(date);
    const dateNum = date.getDate();

    const cells = ROLES.map(role => {
      const def = role.default;
      const optionsList = def
        ? `<option value="${def}">${def}</option>${participants.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`
        : participants.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');

      return `
        <td>
          <select data-date="${key}" data-role="${role.id}">
            ${!def ? '<option value="">—</option>' : ''}
            ${optionsList}
          </select>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="col-date"><span class="date-num">${dateNum} ${MONTH_NAMES[month]}</span></td>
        ${cells}
      </tr>
    `;
  }).join('');
}

function bindSelects(container) {
  container.querySelectorAll('select').forEach(sel => {
    const key = sel.dataset.date;
    const roleId = sel.dataset.role;
    const role = ROLES.find(r => r.id === roleId);
    sel.value = getAssignment(key, roleId) ?? role?.default ?? '';
    sel.addEventListener('change', () => setAssignment(key, roleId, sel.value || null));
  });
}

function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById('currentMonth').textContent = `${MONTH_NAMES[month]} ${year}`;

  const dates = getServiceDates(year, month);
  const { sundays, tuesdays } = splitByDayOfWeek(dates);
  const container = document.getElementById('scheduleContent');

  const tableHeader = `
    <thead>
      <tr>
        <th class="col-date">Дата</th>
        <th>Ведущий</th>
        <th>Бэк</th>
        <th>Фоно</th>
        <th>Бар</th>
        <th>Гитара</th>
      </tr>
    </thead>
  `;

  let html = '';

  if (sundays.length > 0) {
    html += `
      <div class="schedule-section">
        <div class="section-header sunday">Воскресенья</div>
        <div class="schedule-table-wrap sunday">
          <table class="schedule-table">
            ${tableHeader}
            <tbody>${renderDateRows(sundays)}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (tuesdays.length > 0) {
    html += `
      <div class="schedule-section">
        <div class="section-header tuesday">Вторники</div>
        <div class="schedule-table-wrap tuesday">
          <table class="schedule-table">
            ${tableHeader}
            <tbody>${renderDateRows(tuesdays)}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  container.innerHTML = html || '<p class="empty-hint">В этом месяце нет служений</p>';
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
