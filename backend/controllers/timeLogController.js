const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const findOwned = require('../utils/findOwned');
const {
  assertObjectId,
  requireString,
  optionalString,
  parseNumber,
  parseDate,
} = require('../utils/validate');

const PROJECT_FIELDS = 'name hourlyRate';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseHours = (value) => {
  const hours = parseNumber(value, 'Hours');
  if (hours <= 0) {
    throw httpError(400, 'Hours must be greater than 0');
  }
  return hours;
};

// POST /api/time-logs
const createTimeLog = asyncHandler(async (req, res) => {
  const projectId = requireString(req.body.project, 'Project');
  const date = parseDate(req.body.date, 'Date');
  const hours = parseHours(req.body.hours);

  // The project must belong to the logged-in freelancer.
  await findOwned(Project, projectId, req.user.id, 'Project');

  const timeLog = await TimeLog.create({
    project: projectId,
    date,
    hours,
    description: optionalString(req.body.description),
    freelancer: req.user.id, // always taken from the JWT, never from the request body
  });

  await timeLog.populate('project', PROJECT_FIELDS);
  res.status(201).json(timeLog);
});

// GET /api/time-logs?project=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD
const getTimeLogs = asyncHandler(async (req, res) => {
  const { project, from, to } = req.query;

  // Ownership filter is always applied, whatever other filters are used.
  const query = { freelancer: req.user.id };

  if (project !== undefined) {
    assertObjectId(project, 'project');
    query.project = project;
  }

  if (from !== undefined || to !== undefined) {
    query.date = {};
    if (from !== undefined) {
      query.date.$gte = parseDate(from, 'From date');
    }
    if (to !== undefined) {
      const end = parseDate(to, 'To date');
      // A date-only "to" value should include the whole day.
      if (DATE_ONLY_PATTERN.test(to)) end.setUTCHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
    if (query.date.$gte && query.date.$lte && query.date.$gte > query.date.$lte) {
      throw httpError(400, 'From date must not be after To date');
    }
  }

  const timeLogs = await TimeLog.find(query)
    .populate('project', PROJECT_FIELDS)
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json(timeLogs);
});

// GET /api/time-logs/:id
const getTimeLog = asyncHandler(async (req, res) => {
  const timeLog = await findOwned(TimeLog, req.params.id, req.user.id, 'Time log');
  await timeLog.populate('project', PROJECT_FIELDS);
  res.status(200).json(timeLog);
});

// PUT /api/time-logs/:id
const updateTimeLog = asyncHandler(async (req, res) => {
  const timeLog = await findOwned(TimeLog, req.params.id, req.user.id, 'Time log');

  if (req.body.project !== undefined) {
    const projectId = requireString(req.body.project, 'Project');
    await findOwned(Project, projectId, req.user.id, 'Project');
    timeLog.project = projectId;
  }
  if (req.body.date !== undefined) timeLog.date = parseDate(req.body.date, 'Date');
  if (req.body.hours !== undefined) timeLog.hours = parseHours(req.body.hours);
  if (req.body.description !== undefined) timeLog.description = optionalString(req.body.description);

  await timeLog.save();
  await timeLog.populate('project', PROJECT_FIELDS);
  res.status(200).json(timeLog);
});

// DELETE /api/time-logs/:id
const deleteTimeLog = asyncHandler(async (req, res) => {
  const timeLog = await findOwned(TimeLog, req.params.id, req.user.id, 'Time log');
  await timeLog.deleteOne();
  res.status(200).json({ message: 'Time log deleted' });
});

module.exports = { createTimeLog, getTimeLogs, getTimeLog, updateTimeLog, deleteTimeLog };
