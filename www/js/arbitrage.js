'use strict';

var C = {};

var Arb = {

    locked: false,

    init: function() {

        Arb.lock();

        $.ajax({
            url: '/constants',
            success: function(response) {
                var key = '';
                for (key in response) {
                    C[key] = response[key];
                }
                Arb.loadScript('/js/arbitrage.websocket.js', function() {
                    Arb.loadScript('/js/arbitrage.module.js', function() {
                        Arb.Websocket.init();
                    });
                });
            }
        });

    },

    loadScript: function(url, callback) {
      
        $.ajax({
            url: url,
            success: function(response) {
                var script = document.createElement('script');
                script.innerHTML = response;
                document.body.appendChild(script);
                callback();
            }
        });
        
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

