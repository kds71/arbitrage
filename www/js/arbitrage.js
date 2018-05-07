'use strict';

var signed = function(l) {
        l[1].signature = l[0];
        return l[1];
    };

var C = {};

var Arb = {

    LoadedModules: {},

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

        $(document).on('submit', 'form', Arb.formSubmitHandler);

    },

    registerWebsocketListeners: function(component) {

        var prop = '';
        
        for (prop in component) {

            if (typeof component[prop] == 'function'
                    && component[prop]
                    && component[prop].signature
                    && component[prop].signature.message) {
                
                Arb.Websocket.listeners[component[prop].signature.message] = Arb.Websocket.listeners[component[prop].signature.message] || [];
                Arb.Websocket.listeners[component[prop].signature.message].push(component[prop]);
            }
        }

    },
    
    formSubmitHandler: function(e) {

        var $target = $(e.currentTarget),
            data = Arb.collectFormData($target);

        if (!Arb.locked) {
            $target.find('p.error').hide();
            Arb.lock();
            data.message = C[$target.attr('action')];
            Arb.Websocket.send(data);
        }

        e.preventDefault();
        return false;

    },

    collectFormData: function($target) {

        var $fields = $target.find('input,select,textarea'),
            data = {};

        $fields.each(function() {

            var $f = $(this),
                fname = $f.attr('name');

            if ($f.is('input[type="checkbox"]')) {
                data[fname] = !!$f.prop('checked');
            } else {
                data[fname] = $f.val();
            }

        });
        
        return data;

    },
    
    showFormErrors: function($target, fields) {

        var $errors = $target.find('p.error');

        $errors.each(function() {

            var $e = $(this),
                efields = $e.attr('data-field').split(' '),
                i = 0;

           for (i = 0; i < efields.length; i++) {
               if (~fields.indexOf(efields[i])) {
                   $e.show();
                   break;
               }
           }

        });

    },

    websocketReady: function() {

        Arb.Module.init();

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

