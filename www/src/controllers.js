angular.module('app.controllers', [])

    .controller('HomeViewController', ['$scope', '$state', '$http', 'framework', 'helpers', function ($scope, $state, $http, framework, helpers) {
        
        // check connection
        if (!framework.connected()) {
            $state.go('connection', { type: 'auto' });
        }

        // check login
        framework.api.isAuthenticated().then(function () {
            $state.go('home');
        }).catch(function () {
            $state.go('login');
        });

    }])

    .controller('ConnectionViewController', ['$scope', '$state', '$http', 'framework', 'helpers', function ($scope, $state, $http, framework, helpers) {
        var _ = helpers._;
        var type = $state.params.type || 'connect';
        
        $scope.showNodes = true; //false;
        $scope.nodes = [];
        $scope.gridColumns = function () {
            return Math.ceil(Math.sqrt($scope.nodes.length)) || 1;
        }

        function autoConnect(count) {
            var cnt = count || 1;
            var lastNode = _.findWhere(_.sortByOrder($scope.nodes, ['lastConnected'], ['desc']));
            framework.Nodes.query(lastNode).then(function () { 
                framework.connect(lastNode);
                framework.once('connect', function () {
                    framework.api.isAuthenticated().then(function () { 
                        $state.go('home');
                    }).catch(function () { 
                        $state.go('login');
                    });
                });
            }, function () { 
                if (cnt < 4) {
                    setTimeout(function () {
                        autoConnect(cnt + 1);
                    }, 500)
                } else { 
                    $state.go('connection');
                }
            });
        }

        // init
        if (type == 'connect' || type == 'auto') {
            // get the nodes
            $scope.nodes = framework.Nodes.get();
            framework.Nodes.on('add update remove', function () {
                $scope.nodes = framework.Nodes.get();
            });
            framework.Nodes.discover();
            // make the connection
            if (type == 'auto') {
                autoConnect();
            } else {
                $scope.showNodes = true;
            }
        } else if (type == 'login') { 
            // 
        
        }



        



        //$scope.login = function () {
        //    var json = { username: $scope.username, password: $scope.password };
        //    $http.post('/api/auth/login', json, {}).then(function (result, status) {
        //        console.log(result);
        //        $state.go('home', { x: 1 });
        //    }).catch(function (error) {
        //        console.log(error);
        //        $state.go('home', { x: 2 });
        //    });
        //}
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

    .controller('MainViewController', ['$scope', '$state', '$mdSidenav', 'framework', function ($scope, $state, $mdSidenav, framework) {
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
