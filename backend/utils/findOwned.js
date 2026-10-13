const httpError = require('./httpError');
const { assertObjectId } = require('./validate');

// Finds one document that belongs to the logged-in freelancer.
// Ownership is enforced inside the database query itself, so changing the ID
// in the URL can never return another user's data. A document that exists but
// belongs to someone else is reported as "not found" (404) so its existence
// is not revealed.
const findOwned = async (Model, id, freelancerId, label) => {
  assertObjectId(id, label);
  const document = await Model.findOne({ _id: id, freelancer: freelancerId });
  if (!document) {
    throw httpError(404, `${label} not found`);
  }
  return document;
};

module.exports = findOwned;
