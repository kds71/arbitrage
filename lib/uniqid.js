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
    
    console.log(base);
    console.log(timestamp);

    console.log(base.substr(0, 4), base.substr(4, 3), base.substr(7, 3), base.substr(10, 3));
    console.log(timestamp.substr(0, 2), timestamp.substr(2, 3), timestamp.substr(5, 3), timestamp.substr(8, 3));

    return parts.join('-');

};

