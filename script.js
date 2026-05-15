class SchedulePlanner {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.selectedEvent = null;
        this.selectedDay = null;
        this.selectedSlot = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateTimeSlots();
        this.render();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.previousWeek());
        document.getElementById('nextWeek').addEventListener('click', () => this.nextWeek());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllEvents());

        // Quick Add Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeQuickAddModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeQuickAddModal());
        document.getElementById('addEventBtn').addEventListener('click', () => this.addEvent());

        // Event Modal
        document.getElementById('closeEventModal').addEventListener('click', () => this.closeEventModal());
        document.getElementById('closeEventBtn').addEventListener('click', () => this.closeEventModal());
        document.getElementById('deleteEventBtn').addEventListener('click', () => this.deleteEvent());
        document.getElementById('editEventBtn').addEventListener('click', () => this.openEditModal());

        // Edit Modal
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('updateEventBtn').addEventListener('click', () => this.updateEvent());

        // Close modals on outside click
        document.getElementById('quickAddModal').addEventListener('click', (e) => {
            if (e.target.id === 'quickAddModal') this.closeQuickAddModal();
        });
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeEventModal();
        });
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeEditModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeQuickAddModal();
                this.closeEventModal();
                this.closeEditModal();
            }
        });
    }

    generateTimeSlots() {
        const timeSlots = document.getElementById('timeSlots');
        timeSlots.innerHTML = '';

        for (let i = 8; i <= 22; i++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            const hour = i > 12 ? i - 12 : i;
            const ampm = i >= 12 ? 'PM' : 'AM';
            slot.textContent = `${hour}:00 ${ampm}`;
            timeSlots.appendChild(slot);
        }

        // Populate time selectors
        this.populateTimeSelectors();
    }

    populateTimeSelectors() {
        const selectors = ['eventStartTime', 'editEventStartTime'];
        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            selector.innerHTML = '';
            for (let i = 8; i <= 22; i++) {
                const option = document.createElement('option');
                option.value = i;
                const hour = i > 12 ? i - 12 : i;
                const ampm = i >= 12 ? 'PM' : 'AM';
                option.textContent = `${hour}:00 ${ampm}`;
                selector.appendChild(option);
            }
        });
    }

    getWeekDays() {
        const start = new Date(this.currentDate);
        start.setDate(start.getDate() - start.getDay() + 1);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }

    updateWeekLabel() {
        const days = this.getWeekDays();
        const start = days[0];
        const end = days[6];
        const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endMonth = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('weekLabel').textContent = `${startMonth} - ${endMonth}`;
    }

    render() {
        this.updateWeekLabel();
        const daysContainer = document.getElementById('daysContainer');
        daysContainer.innerHTML = '';

        const weekDays = this.getWeekDays();

        weekDays.forEach((date, dayIndex) => {
            const dayColumn = this.createDayColumn(date, dayIndex);
            daysContainer.appendChild(dayColumn);
        });
    }

    createDayColumn(date, dayIndex) {
        const dayColumn = document.createElement('div');
        const dateStr = this.getDateString(date);
        const isToday = this.isToday(date);

        dayColumn.className = `day-column ${isToday ? 'day-today' : ''}`;

        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = date.getDate();

        const header = document.createElement('div');
        header.className = 'day-header';
        header.innerHTML = `<div class="day-name">${dayName}</div><div class="day-date">${dayDate}</div>`;

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'day-slots';

        for (let hour = 8; hour <= 22; hour++) {
            const slot = document.createElement('div');
            slot.className = 'day-slot empty';
            slot.dataset.hour = hour;
            slot.dataset.date = dateStr;

            // Add click event for adding new event
            slot.addEventListener('click', (e) => {
                if (!e.target.classList.contains('event')) {
                    this.selectedDay = dateStr;
                    this.selectedSlot = hour;
                    this.openQuickAddModal(hour);
                }
            });

            slotsContainer.appendChild(slot);
        }

        dayColumn.appendChild(header);
        dayColumn.appendChild(slotsContainer);

        // Render events for this day
        this.renderEventsForDay(slotsContainer, dateStr);

        return dayColumn;
    }

    renderEventsForDay(slotsContainer, dateStr) {
        const dayEvents = this.events.filter(e => e.date === dateStr);

        dayEvents.forEach(event => {
            const startHour = event.startTime;
            const slots = slotsContainer.querySelectorAll('.day-slot');

            for (let i = 0; i < event.duration * 2; i++) {
                const slotIndex = startHour - 8 + (i / 2);
                if (slotIndex >= 0 && slotIndex < slots.length) {
                    const slot = slots[Math.floor(slotIndex)];
                    if (!slot.querySelector('.event')) {
                        slot.classList.remove('empty');
                    }
                }
            }

            const firstSlot = slotsContainer.querySelector(`[data-hour="${startHour}"]`);
            if (firstSlot) {
                const eventElement = this.createEventElement(event, dateStr);
                eventElement.style.top = '0';
                eventElement.style.height = (event.duration * 60) + 'px';
                firstSlot.appendChild(eventElement);
            }
        });
    }

    createEventElement(event, dateStr) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.style.backgroundColor = event.color;
        eventElement.style.borderLeftColor = event.color;
        eventElement.innerHTML = `<span class="event-title">${event.title}</span>`;

        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedEvent = event;
            this.showEventModal(event);
        });

        return eventElement;
    }

    openQuickAddModal(hour) {
        const modal = document.getElementById('quickAddModal');
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventStartTime').value = hour;
        document.getElementById('eventDuration').value = '2';
        document.getElementById('color2').checked = true;

        modal.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    closeQuickAddModal() {
        document.getElementById('quickAddModal').classList.remove('active');
    }

    addEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const startTime = parseInt(document.getElementById('eventStartTime').value);
        const duration = parseInt(document.getElementById('eventDuration').value);
        const color = document.querySelector('input[name="color"]:checked').value;

        if (!title) {
            alert('Please enter an event title');
            return;
        }

        const event = {
            id: Date.now(),
            date: this.selectedDay,
            title,
            description,
            startTime,
            duration,
            color
        };

        this.events.push(event);
        this.saveEvents();
        this.closeQuickAddModal();
        this.render();
    }

    showEventModal(event) {
        document.getElementById('eventTitle2').textContent = event.title;
        document.getElementById('eventDesc').textContent = event.description || 'No description';

        const hour = event.startTime > 12 ? event.startTime - 12 : event.startTime;
        const ampm = event.startTime >= 12 ? 'PM' : 'AM';
        const endHour = event.startTime + event.duration > 12 ? event.startTime + event.duration - 12 : event.startTime + event.duration;
        const endAmpm = event.startTime + event.duration >= 12 ? 'PM' : 'AM';

        document.getElementById('eventTime').textContent = `${hour}:00 ${ampm} - ${endHour}:00 ${endAmpm}`;

        document.getElementById('eventModal').classList.add('active');
    }

    closeEventModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    openEditModal() {
        const event = this.selectedEvent;
        document.getElementById('editEventTitle').value = event.title;
        document.getElementById('editEventDescription').value = event.description;
        document.getElementById('editEventStartTime').value = event.startTime;
        document.getElementById('editEventDuration').value = event.duration;
        document.querySelector(`input[name="editColor"][value="${event.color}"]`).checked = true;

        this.closeEventModal();
        document.getElementById('editModal').classList.add('active');
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
    }

    updateEvent() {
        const event = this.selectedEvent;
        event.title = document.getElementById('editEventTitle').value.trim();
        event.description = document.getElementById('editEventDescription').value.trim();
        event.startTime = parseInt(document.getElementById('editEventStartTime').value);
        event.duration = parseInt(document.getElementById('editEventDuration').value);
        event.color = document.querySelector('input[name="editColor"]:checked').value;

        if (!event.title) {
            alert('Please enter an event title');
            return;
        }

        this.saveEvents();
        this.closeEditModal();
        this.render();
    }

    deleteEvent() {
        if (confirm('Are you sure you want to delete this event?')) {
            const index = this.events.findIndex(e => e.id === this.selectedEvent.id);
            if (index > -1) {
                this.events.splice(index, 1);
                this.saveEvents();
                this.closeEventModal();
                this.render();
            }
        }
    }

    previousWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.render();
    }

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    clearAllEvents() {
        if (confirm('Are you sure you want to delete all events? This cannot be undone.')) {
            this.events = [];
            this.saveEvents();
            this.render();
        }
    }

    getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    saveEvents() {
        localStorage.setItem('scheduleEvents', JSON.stringify(this.events));
    }

    loadEvents() {
        const stored = localStorage.getItem('scheduleEvents');
        return stored ? JSON.parse(stored) : [];
    }
}

// Initialize the planner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SchedulePlanner();
});
