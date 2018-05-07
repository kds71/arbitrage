'use strict';

Arb.LoadedModules.login = {

    rendered: false,

    init: function() {

        if (!Arb.LoadedModules.login.rendered) {
            Arb.LoadedModules.login.rendered = true;
            Arb.LoadedModules.login.$container = Arb.Module.renderModuleContainer('login', 'main', {});
        }

        Arb.Module.displayModule('login');
        Arb.LoadedModules.login.$container.find('input').eq(0).focus();

    }

};

