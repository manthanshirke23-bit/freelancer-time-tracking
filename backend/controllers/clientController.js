const Client = require('../models/Client');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const findOwned = require('../utils/findOwned');
const { requireString, optionalString, optionalEmail } = require('../utils/validate');

// POST /api/clients
const createClient = asyncHandler(async (req, res) => {
  const client = await Client.create({
    name: requireString(req.body.name, 'Name'),
    email: optionalEmail(req.body.email),
    phone: optionalString(req.body.phone),
    freelancer: req.user.id, // always taken from the JWT, never from the request body
  });
  res.status(201).json(client);
});

// GET /api/clients
const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({ freelancer: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(clients);
});

// GET /api/clients/:id
const getClient = asyncHandler(async (req, res) => {
  const client = await findOwned(Client, req.params.id, req.user.id, 'Client');
  res.status(200).json(client);
});

// PUT /api/clients/:id
const updateClient = asyncHandler(async (req, res) => {
  const client = await findOwned(Client, req.params.id, req.user.id, 'Client');

  if (req.body.name !== undefined) client.name = requireString(req.body.name, 'Name');
  if (req.body.email !== undefined) client.email = optionalEmail(req.body.email);
  if (req.body.phone !== undefined) client.phone = optionalString(req.body.phone);

  await client.save();
  res.status(200).json(client);
});

// DELETE /api/clients/:id
const deleteClient = asyncHandler(async (req, res) => {
  const client = await findOwned(Client, req.params.id, req.user.id, 'Client');

  const projectCount = await Project.countDocuments({ client: client._id, freelancer: req.user.id });
  if (projectCount > 0) {
    throw httpError(400, 'This client still has projects. Delete those projects first.');
  }

  await client.deleteOne();
  res.status(200).json({ message: 'Client deleted' });
});

module.exports = { createClient, getClients, getClient, updateClient, deleteClient };
