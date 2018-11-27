'use strict';
angular
  .module("myApp.view", [])
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
  .controller("ViewCtrl", ['$scope', '$http', '$mdDialog', '$state', 'myService',
    function ($scope, $http, $mdDialog, $state, myService) {

      $scope.user = {};
      $scope.location = {};
      $scope.property = {};
      $scope.Subscribe1 = false;
      $scope.showSignup = false;
      $scope.latlong = false;
      $scope.showMap = false;
      $scope.price = false;
      $scope.pdfShow = false;
      $scope.disablledButton = true;
      $scope.activate = false;
      $scope.prodectActivate = false;
      $scope.yesHide = true;
      $scope.showMode2 = false;
      $scope.paymentAccepted = false;
      $scope.onclickDisable = false;
      $scope.activateButton = false;
      $scope.submitfalse = false;
      $scope.property.checkBox = false;
      $scope.hidesub = true;
      $scope.currentDate = new Date();
      $scope.ph_numbr = /^\+?\d{10}$/;
      $scope.eml_add = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
      $http.get("/wsapi/static/country").then(function (result) {
        console.log(result.data);
        $scope.countryArray = result.data;
        $scope.countryArrayOne = result.data;
      });

      $http.get("/wsapi/static/propertyType").then(function (result) {
        console.log(result.data);
        $scope.propertyType = result.data;
      });

      $http.get("/wsapi/prop/dev").then(function (result) {
        console.log(result.data);
        $scope.developer = result.data;
      });

      $scope.onChangeCountry = function (key, value) {
        switch (key) {
          case 0:
            console.log('value of country ', value);
            var stateObj = {};
            stateObj.countryId = value.country.id;
            console.log("StateObj that i send", stateObj);

            $http.post('/wsapi/static/state', stateObj)
              .then(function successCallback(response) {
                console.log("response for state variables", response.data);

                $scope.stateArray = response.data;
              }, function errorCallback(response) {
                console.log('error', response)
              });

            break;
          case 1:
            console.log("value of state ", value);
            var stateObjOne = {};
            stateObjOne.countryId = value.country.id;
            console.log("stateObjOne that i send", stateObjOne);

            $http.post('/wsapi/static/state', stateObjOne)
              .then(function successCallback(response) {
                console.log("response for state variables", response.data);

                $scope.stateArrayOne = response.data;
              }, function errorCallback(response) {
                console.log('error', response)
              });

            break;
          case 2:
            console.log('value of city ', value);
            var stateObjOne = {};
            stateObjOne.stateId = value.state.id;
            console.log("stateObjOne that i send", stateObjOne);

            $http.post('/wsapi/static/city', stateObjOne)
              .then(function successCallback(response) {
                console.log("response for city variables", response.data);

                $scope.cityArray = response.data;
              }, function errorCallback(response) {
                console.log('error', response)
              });

            break;
          case 3:
            console.log('value of propert devloper type ', value);
            var propertyDevloper = {};
            propertyDevloper.developer = value.developerType;
            console.log("propertyDevloper that i send", propertyDevloper);

            $http.post('/wsapi/prop/proName', propertyDevloper)
              .then(function successCallback(response) {
                console.log("response for developer data", response.data);

                $scope.propertyName = response.data;
              }, function errorCallback(response) {
                console.log('error', response)
              });
            break;
          case 4:
            console.log('value defalult country', value);
            var propertyLocation = {};
            propertyLocation.developer = value.developerType;
            propertyLocation.propertyName = value.propertyName;

            console.log("propertyDevloper that i send", propertyLocation);

            $http.post('/wsapi/prop/proLoc', propertyLocation)
              .then(function successCallback(response) {
                console.log("response of location", response.data);
                $scope.defaultCountry = response.data[0].propertyCountry
                $scope.defaultDistrict = response.data[0].propertyDistrict
                $scope.defaultState = response.data[0].propertyState
                console.log('defaultCountry', $scope.defaultCountry)
              }, function errorCallback(response) {
                console.log('error', response)
              });
            break;
        }
        console.log('', value)
      }
      $scope.GetStarted = function () {
        $scope.Subscribe1 = true;
      };
      $scope.subscribe = function () {
        $scope.showSignup = true;
        $scope.hidesub=false;
      };

      $scope.onChangeFilter = function (key, value) {
        switch (key) {
          case 0:
            console.log(value)
            if (value == undefined) {
              console.log('value is undefined')
            } else {

              console.log("came into switch", value)
              if (value == 'Basic') {
                console.log('Basic')
                $scope.pdfShow = true;
              } else if (value == 'Silver') {
                console.log("Silver");
                $scope.pdfShow = true;

              } else if (value == 'Gold') {
                console.log("Gold");
                $scope.pdfShow = true;

              } else if (value == 'Platinum') {
                console.log("Platinum");
                $scope.pdfShow = true;
              }
            }
            break;
        }
      }
      $scope.loginSwapSignup= function (val) {
        console.log('came inside the ', val)
        if(!val)
        {
          $scope.loginShow = true;
          $scope.showSignup = false;
        }
        else
        {
            $scope.loginShow = false;
            $scope.showSignup = true;
        }
        
      }

      $scope.loginValidation=function (loginData) {
        console.log('loginData', loginData);
        let loginObj={};
        loginObj.email = loginData.userName;
        loginObj.pwd = loginData.password;
         $http.post('/wsapi/customer/vCred', loginObj)
           .then(function successCallback(response) {
               console.log('response', response);
               myService.setJson(response.data);
               $state.go('LoginDetail');
             }, function errorCallback(err) {
               console.log('error', err)
                $mdDialog.show(
                  $mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title(err.data)
                  .ok('Close')
                );
             });
      }

       
       $scope.showPrompt = function () {
         var confirm = $mdDialog.prompt()
           .textContent('Enter your registered Email Id.')
           .placeholder('Enter your Email Id.')
           .ariaLabel('Email Id')
           .required(true)
           .ok('OK')
           .cancel('Cancel');
         $mdDialog.show(confirm).then(function (result) {
           console.log('reult', result);
           var obj={};
           obj.email=result;
            $http.post('/wsapi/customer/rstCred', obj)
              .then(function successCallback(response) {
                  console.log('res', response);
                   $mdDialog.show(
                     $mdDialog.alert()
                     .clickOutsideToClose(true)
                     .htmlContent("<h4>Your request is accepted</h4><br><p>You will recive the new password <br>in your registered Email Id.</p>")
                     .ok('Close')
                   );
              }, function errorCallback(err) {
                console.log('error', err)
                $mdDialog.show(
                  $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .htmlContent("<p>User does not exist. Please sign up.</p>")
                    .ok('Close')
                );
              });
          
         }, function () {});
       };
      
      $scope.onclick = function (user) {
        $scope.postObj = [];
        $scope.emailDetails = "";
        console.log("user>>>>>>", user);
        var obj = {};
        obj.firstName = user.Fname;
        obj.lastName = user.Lname;
        obj.email = user.email;
        $scope.emailDetails = user.email;
        obj.referringCompany = 'Web-direct';
        obj.reportType = 'Basic';
        obj.reportSubscribed = false;
        console.log('obj that i send ', obj);
        $http.post('/wsapi/customer', obj)
          .then(function successCallback(response) {
           
            $scope.prodectActivate = true;            
            $scope.showSignup = false;
            $scope.postObj = response.data;
            console.log('postobj', $scope.postObj);
            document.querySelector('#Prodectdetails').focus();

          }, function errorCallback(err) {
            console.log('error', err)
            $scope.spanError = err.data;
           
            $mdDialog.show(
              $mdDialog.alert()
              .clickOutsideToClose(true)
              .title($scope.spanError)
              .textContent('Try with a different email Id.')
              .ok('Close')
            );

          });
      };

      $scope.activateSubcribe = function () {
        $scope.activate = true;
      };

      $scope.productOnSubmit = function (property) {
        $scope.price = true;

        console.log('property details', property);
        console.log('defaultCountry', $scope.defaultCountry);
        var date = new Date(property.myDate);
        console.log('Date', date)
        var updateProperty = {};
        updateProperty.email = $scope.emailDetails;
        updateProperty.dateBought = date;
        updateProperty.checkBox = property.checkBox;
        if (property.checkBox) {
          updateProperty.propertyDeveloper = property.developerText ? property.developerText : null;
          updateProperty.propertyName = property.developerTypeText ? property.developerTypeText : null;
          updateProperty.propertyCountry = property.country ? property.country.name : null;
          updateProperty.propertyState = property.state ? property.state.name : null;
          updateProperty.propertyDistrict = property.city ? property.city.name : null;
        } else {
          updateProperty.propertyDeveloper = property.developerType ? property.developerType : null;
          updateProperty.propertyName = property.propertyName ? property.propertyName : null;
          updateProperty.propertyCountry = $scope.defaultCountry;
          updateProperty.propertyState = $scope.defaultState;
          updateProperty.propertyDistrict = $scope.defaultDistrict;
        }
        updateProperty.propertyType = property.propertyType.propertyType ? property.propertyType.propertyType : null;
        updateProperty.area = property.area ? property.area : null;
        updateProperty.measure = property.measure ? property.measure : null;
        updateProperty.propertyNumber = property.propertyNumber ? property.propertyNumber : null;
        updateProperty.ratePerSq = property.RatePerSq ? property.RatePerSq : null;
        console.log("obj that i send to updateProperty >>>>>>", updateProperty);

        $http.put('/wsapi/customer/updProp', updateProperty)
          .then(function successCallback(response) {
            console.log("updateProperty response", response);
            $scope.submitfalse = true;
          }, function errorCallback(response) {
            console.log('error', response)
          });

      };

      $scope.modeShow = function (value) {
        console.log('value=>>>>>>>', value)
        if (value.country && value.state) {
          let updateUser = {};
          updateUser.email = $scope.emailDetails;
          updateUser.country = value.country.name ? value.country.name : null;
          updateUser.state = value.state.name ? value.state.name : null;
          updateUser.ownaproperty = true;
          console.log("updateUser>>>>>>>>>>>>>>", updateUser);
          $http
            .put("/wsapi/customer/upd", updateUser)
            .then(
              function successCallback(response) {
                console.log("updateProperty response", response);
                $scope.activateButton = true;
              },
              function errorCallback(response) {
                console.log("error", response);
              }
            );
          $scope.showMode2 = true;
          $scope.yesHide = false;
        } else {
          $mdDialog.show(
            $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Enter the county and state')
            .ariaLabel('Alert Dialog Demo')
            .ok('Got it!')
          );
        }
      }
      $scope.latLong = function () {
        $scope.showMap = true;
      };
      $scope.showpricing = function () {
        $scope.price = true;
        $scope.disablledButton = true;
      };

      $scope.subscribeButtonOnclick = function (pay) {


        console.log("datadata", pay);
        $scope.reportType = pay;
        let objSubOnClick = {};
        objSubOnClick.reportSubscribed = true;
        objSubOnClick.reportType = pay;
        objSubOnClick.email = $scope.emailDetails;

        console.log("objSubOnClickobjSubOnClick", objSubOnClick);

        $http
          .put("/wsapi/customer/updPay", objSubOnClick)
          .then(
            function successCallback(response) {
              console.log("updateProperty response", response);
              $scope.paymentAccepted = true;
              $scope.onclickDisable = true;
              // $mdDialog.show(
              //   $mdDialog.alert()
              //     .clickOutsideToClose(true)
              //     .title('This is an alert title')
              //     .ariaLabel('Alert Dialog Demo')
              //     .ok('Got it!')
              // );
            },
            function errorCallback(response) {
              console.log("error", response);
            }
          );
      }

      $scope.allClearAfterPay = function () {
        $window.close();
      }
      console.log(
        "$scope.dataa-------------------------------------",
        $scope.data
      );

      //   var map;
      //   var uluru = { lat: 13.15, lng: 77.57 };
      //   var bounds = new google.maps.LatLngBounds();

      // // // $scope.latLong=function (lat,long)
      // // // {
      // // //   // console.log("latlong",lat,long)
      // // //   // uluru = { lat: lat, lng: long };
      // // // }
      // function initMap() {
      //   map = new google.maps.Map(
      //     document.getElementById('map'), { zoom: 10, center: uluru });
      // }
      // initMap();
      // var marker = new google.maps.Marker({ position: uluru, map: map });
      // bounds.extend(marker);
      // map.fitBounds(bounds);
      // console.log(map)
      $scope.getStyle = function (showMap) {
        if (showMap) {
          console.log("showmapp", showMap);
          return {
            visibility: "visible"
          };
        } else {
          console.log("showmap", showMap);
          return {
            visibility: "hidden"
          };
        }
      };

      var map, marker;
      $scope.showMap = false;

      $scope.initMap = function (la, ln) {
        $scope.disablledButton = false;
        $scope.showMap = true;
        console.log(la, ln);
        var lati = Number(la);
        var lon = Number(ln);
        // console.log("map id", document.getElementById("map"));
        // var myLatLng = { lat: 12.989907, lng: 77.554033 };
        var myLatLng = {
          lat: lati,
          lng: lon
        };

        $scope.map = new google.maps.Map(document.getElementById("map"), {
          zoom: 12,
          center: myLatLng
        });

        marker = new google.maps.Marker({
          position: myLatLng,
          map: $scope.map,
          title: "Hello World!"
        });
      };
    }
  ])
  .controller("emailCtrl", ['$scope', '$http',
        function ($scope, $http, $mdDialog) {
          let ur = window.location.hash;
          ur = ur.slice(2, ur.length);
          //console.log('-----slice -----: ', ur);
          let urlObj = {};
          urlObj.fetchedUrl = ur;

          $http
            .post("/wsapi/customer/emailAuth", urlObj)
            .then(
              function successCallback(response) {
                console.log("updateProperty response", response);
              },
              function errorCallback(response) {
                console.log("error", response);
              }
            );

        }
  ]).controller("surveyCtrl", ['$scope', '$http', '$mdDialog',
    function ($scope, $http, $mdDialog) {

      $scope.QuestionArray = [{
        format: [{
          quest: "who are you ?",
          answer: [1, 2, 3, 4]
        }, {
          quest: "where are you ?",
          answer: ["lokesh", "kumar"]
        }]
      }];

      $scope.data = function (item) {
        console.log('item', item)
      }
    }
  ]);
  // .controller("loginPage", ['$scope', 'myService' ,
  //   function ($scope, myService) {
  //     $scope.myreturnedData = myService.getJson();
  //     console.log('$scope.myreturnedData', $scope.myreturnedData)
  //   }
  // ]);