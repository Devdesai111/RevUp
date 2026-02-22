'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, comparePassword };
