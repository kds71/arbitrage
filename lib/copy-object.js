'use strict';

var copyObj = module.exports = function(source, target) {

    var i = 0,
        key = '';

    if (Array.isArray(source)) {
        for (i = 0; i < source.length; i++) {
            if (source[i] && typeof source[i] == 'object') {
                if (Array.isArray(source[i])) {
                    target[i] = [];
                } else {
                    target[i] = target[i] || {};
                }
                copyObj(source[i], target[i]);
            } else {
                target[i] = source[i];
            }
        }
    } else {
        for (key in source) {
            if (source[key] && typeof source[key] == 'object') {
                if (Array.isArray(source[key])) {
                    target[key] = [];
                } else {
                    target[key] = target[key] || {};
                }
                copyObj(source[key], target[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

};

