'use strict';

Arb.LoadedModules.login = {

    rendered: false,
    listenersRegistered: false,

    init: function() {

        if (!Arb.LoadedModules.login.rendered) {
            Arb.LoadedModules.login.rendered = true;
            Arb.LoadedModules.login.$container = Arb.Module.renderModuleContainer('login', 'main', {});
        }

        if (!Arb.LoadedModules.login.listenersRegistered) {
            Arb.LoadedModules.login.listenersRegistered = true;
            Arb.registerWebsocketListeners(Arb.LoadedModules.login);
        }

        Arb.Module.displayModule('login');
        Arb.LoadedModules.login.$container.find('input').eq(0).focus();

    },

    loginSuccessListener: signed([

        { message: C.WS_INFO_LOGIN_SUCCESS },
        function(response) {
        }

    ]),

    loginFailedListener: signed([

        { message: C.WS_ERROR_LOGIN_FAILED },
        function(response) {

            var $form = Arb.LoadedModules.login.$container.find('form');
            Arb.showFormErrors($form, response.fields);
            $form.find('input').eq(0).focus();
            Arb.release();

        }

    ]),

    loginRepeatListener: signed([

        { message: C.WS_ERROR_LOGIN_REPEAT },
        function(response) {
        }

    ])

};

