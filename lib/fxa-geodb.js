/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var DEFAULTS = require('./defaults');
var ERRORS = require('./errors');
var maxmind = require('maxmind');
var Location = require('./location');
var Promise = require('bluebird');

module.exports = function (options) {
  'use strict';

  options = options || {};
  var dbPath = options.dbPath || DEFAULTS.DB_PATH;

  var dbLookup = null;
  // we quit if the db did not load for some reason
  try {
    dbLookup = maxmind.open(dbPath);
  } catch (err) {
    // if it failed with primary database
    // then reject the promise below
  }

  return function (ip, options) {
    options = options || {};
    var userLocale = options.userLocale || DEFAULTS.USER_LOCALE;
    return new Promise(function (resolve, reject) {
      if (! dbLookup) {
        return reject({
          message: ERRORS.UNABLE_TO_OPEN_FILE
        });
      }
      // check if ip is valid
      if (! maxmind.validate(ip)) {
        return reject({
          message: ERRORS.IS_INVALID
        });
      }

      var locationData = dbLookup.get(ip);

      if (locationData == null) {
        return reject({
          message: ERRORS.UNABLE_TO_FETCH_DATA
        });
      }

      // return an object with city, country, continent,
      // latitude, and longitude, and timezone
      var location = new Location(locationData, userLocale);

      return resolve(location);
    });
  };
};
