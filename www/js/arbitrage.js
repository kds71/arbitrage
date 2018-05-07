'use strict';

var Arb = {

    locked: false,

    init: function() {

        Arb.Websocket.init();

    },

    lock: function() {

        if (!Arb.locked) {
            Arb.locked = true;
            $('body').addClass('locked');
        }

    },

    release: function() {

        if (Arb.locked) {
            Arb.locked = false;
            $('body').removeClass('locked');
        }

    }

};

$(Arb.init);

