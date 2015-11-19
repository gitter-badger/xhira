angular.module('app.controllers', [])

    .controller('HomeViewController', ['$scope', '$state', '$http', 'helpers', function ($scope, $state, $http, helpers) {
        
        helpers.api.get('/api/location.json').then(function (payload) { 
        
            console.log(JSON.stringify(payload));        

        });

        $http.get('/api/auth', { cache: false }).then(function (payload) {
            var content = payload.data;
            if (!content.data.authenticated) {
                $state.go('login');
            //} else {
            //    $state.go('logout');
            }
            //console.log(JSON.stringify(payload));
        }).catch(function (error) {
            console.log(error);
            //$state.go('home', { x: 2 });
        });
    }])

    .controller('LoginViewController', ['$scope', '$state', '$http', function ($scope, $state, $http) {
        $scope.login = function () {
            var json = { username: $scope.username, password: $scope.password };
            $http.post('/api/auth/login', json, {}).then(function (result, status) {
                console.log(result);
                $state.go('home', { x: 1 });
            }).catch(function (error) {
                console.log(error);
                $state.go('home', { x: 2 });
            });
        }
    }])

    .controller('LogoutViewController', ['$scope', '$state', '$http', function ($scope, $state, $http) {
        $http.get('/api/auth/logout', { cache: false }).then(function (payload) {
            console.log(payload);
            $state.go('home', { x: 1 });
        }).catch(function (error) {
            console.log(error);
            $state.go('home', { x: 2 });
        });
    }])

    .controller('MainViewController', ['$scope', '$state', '$mdSidenav', function ($scope, $state, $mdSidenav) {
        $scope.closeLeftMenu = function () {
            $mdSidenav('left').close();
        };
        $scope.toggleLeftMenu = function () {
            $mdSidenav('left').toggle();
        };
    }])

    .controller('TestViewController', ['$scope', 'helpers', function ($scope, helpers) {

        //localStorage.test = localStorage.test || 1;
        //localStorage.test += 1;

        //$scope.test = 'Hi Test!';
    }])

;
