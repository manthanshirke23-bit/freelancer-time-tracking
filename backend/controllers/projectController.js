const mongoose = require('mongoose');
const Client = require('../models/Client');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const findOwned = require('../utils/findOwned');
const { requireString, optionalString, parseNumber } = require('../utils/validate');

const CLIENT_FIELDS = 'name email';

const parseHourlyRate = (value) => {
  const hourlyRate = parseNumber(value, 'Hourly rate');
  if (hourlyRate < 0) {
    throw httpError(400, 'Hourly rate must be 0 or more');
  }
  return hourlyRate;
};

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'Name');
  const clientId = requireString(req.body.client, 'Client');
  const hourlyRate = parseHourlyRate(req.body.hourlyRate);

  // The client must belong to the logged-in freelancer.
  await findOwned(Client, clientId, req.user.id, 'Client');

  const project = await Project.create({
    name,
    description: optionalString(req.body.description),
    client: clientId,
    hourlyRate,
    freelancer: req.user.id,
  });

  await project.populate('client', CLIENT_FIELDS);
  res.status(201).json(project);
});

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ freelancer: req.user.id })
    .populate('client', CLIENT_FIELDS)
    .sort({ createdAt: -1 });
  res.status(200).json(projects);
});

// GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await findOwned(Project, req.params.id, req.user.id, 'Project');
  await project.populate('client', CLIENT_FIELDS);
  res.status(200).json(project);
});

// PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await findOwned(Project, req.params.id, req.user.id, 'Project');

  if (req.body.name !== undefined) project.name = requireString(req.body.name, 'Name');
  if (req.body.description !== undefined) project.description = optionalString(req.body.description);
  if (req.body.hourlyRate !== undefined) project.hourlyRate = parseHourlyRate(req.body.hourlyRate);
  if (req.body.client !== undefined) {
    const clientId = requireString(req.body.client, 'Client');
    await findOwned(Client, clientId, req.user.id, 'Client');
    project.client = clientId;
  }

  await project.save();
  await project.populate('client', CLIENT_FIELDS);
  res.status(200).json(project);
});

// DELETE /api/projects/:id  (also removes the project's time logs)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await findOwned(Project, req.params.id, req.user.id, 'Project');

  await TimeLog.deleteMany({ project: project._id, freelancer: req.user.id });
  await project.deleteOne();

  res.status(200).json({ message: 'Project and its time logs deleted' });
});

// GET /api/projects/:id/invoice-total
// The total is calculated by MongoDB, not by JavaScript.
const getInvoiceTotal = asyncHandler(async (req, res) => {
  // 1. Verify the project belongs to the logged-in freelancer.
  const project = await findOwned(Project, req.params.id, req.user.id, 'Project');
  await project.populate('client', CLIENT_FIELDS);

  // 2-5. Match this freelancer's logs for the project, join the project to get
  //      its hourlyRate, multiply hours x hourlyRate per log, then sum.
  const [result] = await TimeLog.aggregate([
    {
      // aggregate() does not auto-cast strings to ObjectId, so cast manually.
      $match: {
        project: project._id,
        freelancer: new mongoose.Types.ObjectId(req.user.id),
      },
    },
    {
      $lookup: {
        from: Project.collection.name,
        localField: 'project',
        foreignField: '_id',
        as: 'projectInfo',
      },
    },
    { $unwind: '$projectInfo' },
    {
      $group: {
        _id: '$project',
        totalHours: { $sum: '$hours' },
        invoiceTotal: { $sum: { $multiply: ['$hours', '$projectInfo.hourlyRate'] } },
      },
    },
    {
      // Round to 2 decimals to hide floating-point noise (e.g. 0.1 + 0.2).
      $project: {
        _id: 0,
        totalHours: { $round: ['$totalHours', 2] },
        invoiceTotal: { $round: ['$invoiceTotal', 2] },
      },
    },
  ]);

  // 6. A project with no time logs produces no group, so default to 0.
  res.status(200).json({
    project: {
      id: project._id,
      name: project.name,
      hourlyRate: project.hourlyRate,
      client: project.client ? { id: project.client._id, name: project.client.name } : null,
    },
    totalHours: result ? result.totalHours : 0,
    invoiceTotal: result ? result.invoiceTotal : 0,
  });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getInvoiceTotal,
};
