import { ASSIGNMENT_TYPES, SORT_OPTIONS, STATUS_FILTER_OPTIONS } from '../utils/assignments';

function FilterBar({ filters, classes, onChange, onClear, hasActiveFilters }) {
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        {/* Search */}
        <div className="input-group input-group-lg mb-3">
          <span className="input-group-text bg-body" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            name="search"
            className="form-control"
            placeholder="Search assignments, notes, or classes…"
            value={filters.search}
            onChange={onChange}
            aria-label="Search assignments"
          />
        </div>

        {/* Dropdowns */}
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <label htmlFor="filter-class" className="form-label small fw-semibold mb-1">
              Class
            </label>
            <select
              id="filter-class"
              name="classId"
              className="form-select"
              value={filters.classId}
              onChange={onChange}
            >
              <option value="all">All classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="filter-type" className="form-label small fw-semibold mb-1">
              Type
            </label>
            <select
              id="filter-type"
              name="type"
              className="form-select"
              value={filters.type}
              onChange={onChange}
            >
              <option value="all">All types</option>
              {Object.entries(ASSIGNMENT_TYPES).map(([typeKey, typeInfo]) => (
                <option key={typeKey} value={typeKey}>
                  {typeInfo.icon} {typeInfo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="filter-status" className="form-label small fw-semibold mb-1">
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              className="form-select"
              value={filters.status}
              onChange={onChange}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label htmlFor="filter-sort" className="form-label small fw-semibold mb-1">
              Sort by
            </label>
            <select
              id="filter-sort"
              name="sortBy"
              className="form-select"
              value={filters.sortBy}
              onChange={onChange}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="text-end mt-3">
            <button type="button" className="btn btn-link btn-sm p-0" onClick={onClear}>
              ✖ Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;