angular.module('app.libraries', ['ui.router', 'ngMaterial']);
angular.module('app', ['app.libraries', 'app.helpers', 'app.services', 'app.controllers']);

// routes
angular.module('app')
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home', {
            url: '',
            templateUrl: 'src/views/home.html',
            controller: 'HomeViewController'
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
       // $mdThemingProvider.theme('default')
       // .dark();
    })
    .run(function ($rootScope, $templateCache) {
        $rootScope.$on('$viewContentLoaded', function () {
            $templateCache.removeAll();
        });
    })
;

// bootstrap
angular.element(document).ready(function () {
    angular.bootstrap(document, ['app']);
});
