import { NavLink } from 'react-router-dom';

function CalendarViewSwitch() {
  function getButtonClass({ isActive }) {
    return `btn ${isActive ? 'btn-primary' : 'btn-outline-primary'}`;
  }

  return (
    <div className="btn-group" role="group" aria-label="Calendar view">
      <NavLink to="/week" className={getButtonClass}>
        Week
      </NavLink>
      <NavLink to="/month" className={getButtonClass}>
        Month
      </NavLink>
    </div>
  );
}

export default CalendarViewSwitch;