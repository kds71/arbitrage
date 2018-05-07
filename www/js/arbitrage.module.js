'use strict';

var Arb = Arb || {};

Arb.Module = {

    loadModule: function(name) {

        $.ajax({
            url: '/module/' + Arb.id + '/' + name + '/meta',
            success: function(response) {
                console.log(response);
            }
        });

    }

};

