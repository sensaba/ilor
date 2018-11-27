'use strict';

// Declare app level module which depends on views, and components
angular.module("myApp", [
    "ngRoute",
    "myApp.view",
    "loginUser",
    "myApp.version",
    "ngMaterial",
    "ngMessages",
    "ngAnimate",
    "ui.router",
    "ngSanitize"
  ])
  // .config([
  //   "$locationProvider",
  //   "$routeProvider",
  //   function($locationProvider, $routeProvider) {
  //     $locationProvider.hashPrefix("!");
  //     $routeProvider.when("/", {
  //         templateUrl: "view/view.html",
  //         controller: "ViewCtrl"
  //       }).when("/emailAuth", {
  //         templateUrl: "view/email.html",
  //         controller: "emailCtrl"
  //       }).when("/survey", {
  //         templateUrl: "view/survey.html",
  //         controller: "surveyCtrl"
  //       }).when("/loginPage", {
  //           templateUrl: "view/loginPage.html",
  //           controller: "loginPage"
  //       }).otherwise({
  //             redirectTo: "/"
  //       });

  //   }
  // ])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

    $stateProvider.state('home', {
        url: '/',
        templateUrl: "view/html/view.html",
        controller: "ViewCtrl"
      })
       .state("emailAuth", {
        url: '/emailAuth',
        templateUrl: "view/html/email.html",
        controller: "emailCtrl"
      }).state("survey", {
        url: '/survey',
        templateUrl: "view/html/survey.html",
        controller: "surveyCtrl"
      }).state("LoginDetail", {
        url: '/loginPage',
        templateUrl: "view/html/loginPage.html",
        controller: "loginPage"
      })
      
    $urlRouterProvider.otherwise('/');

  }])
  .config(function($mdThemingProvider) {
    $mdThemingProvider
      .theme("default")
      .primaryPalette("blue")
      .accentPalette("green");
  })
  .factory('myService', function () {
    var myjsonObj = null; //the object to hold our data
    return {
      getJson: function () {
        return myjsonObj;
      },
      setJson: function (value) {
        myjsonObj = value;
      }
    }
  })
 
