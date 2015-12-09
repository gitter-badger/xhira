angular.module('app.libraries', ['ui.router', 'ngMaterial']);
angular.module('app', ['app.libraries', 'app.helpers', 'app.framework', 'app.services', 'app.controllers']);

// routes
angular.module('app')
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home', {
            url: '',
            templateUrl: 'src/views/home.html',
            controller: 'HomeViewController'
        });
        $stateProvider.state('connection', {
            url: '',
            params: { type: null },
            templateUrl: 'src/views/connection.html',
            controller: 'ConnectionViewController'
        });

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'src/views/login.html',
            controller: 'LoginViewController'
        });
        $stateProvider.state('logout', {
            url: '/logout',
            templateUrl: 'src/views/logout.html',
            controller: 'LogoutViewController'
        });
        $stateProvider.state('test', {
            url: '/test',
            templateUrl: 'src/views/test.html',
            controller: 'TestViewController'
        });
        $urlRouterProvider.otherwise('');
    }])
    .config(function ($mdThemingProvider) {
        // themes
        $mdThemingProvider.theme('xhira-dark')
            .primaryPalette('indigo') //, { 'default': '400' })
            .accentPalette('pink', { 'default': '400' })
            .dark();
                //.primaryPalette('purple')
                //.backgroundPalette('grey');
        $mdThemingProvider.theme('xhira-light')
                //.primaryPalette('purple')
                //.backgroundPalette('grey');
                //.dark();
    
        $mdThemingProvider.setDefaultTheme('xhira-light');

    })
    .run(function ($rootScope, $templateCache) {
        $rootScope.$on('$viewContentLoaded', function () {
            $templateCache.removeAll();
        });
    })
;

// bootstrap
angular.element(document).ready(function () {
    document.addEventListener('deviceready', function () { 
        angular.bootstrap(document, ['app']);
    }, false);
});
