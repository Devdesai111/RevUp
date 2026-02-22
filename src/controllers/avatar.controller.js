'use strict';

const { getAvatarState } = require('../services/avatar/avatar.service');
const { sendSuccess } = require('../utils/response.util');

exports.getState = async (req, res, next) => {
  try {
    const state = await getAvatarState(req.user._id);
    return sendSuccess(res, { data: state });
  } catch (err) {
    return next(err);
  }
};
