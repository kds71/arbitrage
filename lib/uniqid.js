'use strict';

var crypto = require('crypto');

module.exports = function() {

    var base = crypto.randomBytes(7).toString('hex'),
        timestamp = Date.now().toString(16),
        
        parts = [
            base.substr(0, 4) + timestamp.substr(0, 2),
            base.substr(4, 3) + timestamp.substr(2, 3),
            base.substr(7, 3) + timestamp.substr(5, 3),
            base.substr(10, 3) + timestamp.substr(8, 3),
        ];
    
    return parts.join('-');

};

