'use strict';
angular
    .module("loginUser", [])
    .controller("loginPage", ['$scope', 'myService',
        function ($scope, myService) {
            $scope.myreturnedData = myService.getJson();
            console.log('$scope.myreturnedData', $scope.myreturnedData)
        }
    ]);