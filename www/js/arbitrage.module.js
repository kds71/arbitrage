'use strict';

var Arb = Arb || {};

Arb.Module = {

    init: function() {

        Arb.Module.cache = {};
        Arb.Module.loadModule('login', function() {
            Arb.Module.switchModule('login');
            Arb.release();
        });

    },

    loadModule: function(name, callback) {

        var module = {
                meta: null,
                templates: null,
                scripts: null
            };

        if (name in Arb.Module.cache) {
            callback();
            return;
        }

        $.ajax({
            url: '/module/' + Arb.id + '/' + name + '/meta',
            success: function(response) {

                module.meta = response;

                Arb.Module.loadTemplates(name, response.templates, module, function() {
                    Arb.Module.loadScripts(name, response.scripts, module, function() {

                        var i = 0,
                            key = '',
                            script = null;

                        Arb.Module.cache[name] = module;
                        for (key in module.scripts) {
                            script = document.createElement('script');
                            script.innerHTML = module.scripts[key];
                            document.body.appendChild(script);
                        }

                        callback();
                        
                    });
                });

            }
        });

    },

    loadTemplates: function(name, queue, module, callback) {

        var item = queue.shift();

        if (!item) {
            callback();
            return;
        }

        $.ajax({
            url: '/module/' + Arb.id + '/' + name + '/template/' + item,
            success: function(response) {

                module.templates = module.templates || {};
                module.templates[item] = response;
                Arb.Module.loadTemplates(name, queue, module, callback);
                
            }
        });

    },

    loadScripts: function(name, queue, module, callback) {

        var item = queue.shift();

        if (!item) {
            callback();
            return;
        }

        $.ajax({
            url: '/module/' + Arb.id + '/' + name + '/script/' + item,
            success: function(response) {

                module.scripts = module.scripts || {};
                module.scripts[item] = response;
                Arb.Module.loadScripts(name, queue, module, callback);
                
            }
        });

    },

    switchModule: function(name) {

        Arb.LoadedModules[name].init();

    },

    renderModuleContainer: function(name, templateName, data) {

        var $container = $('<div class="hidden module-container" data-module-name="' + name + '" data-template-name="' + templateName + '"></div>');
        $container.append(Arb.Module.cache[name].templates[templateName]);
        $('#page-content').append($container);

        return $container;

    },

    displayModule: function(name) {

        $('#page-content > .module-container').addClass('hidden');
        $('#page-content > .module-container[data-module-name="' + name + '"]').removeClass('hidden');

    }

};

