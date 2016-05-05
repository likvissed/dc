var app = angular.module('servers', []);
app.directive('stopClick', function() {
  return function(scope, element, attrs) {
    element.click(function(event) {
      event.preventDefault();
    })
  }
});

app.controller("FlashMessageCtrl",['$attrs', '$timeout', function($attrs, $timeout) {
  controller         = this;
  controller.success = $attrs.success;
  controller.error   = $attrs.error;

  $timeout(function() {
    controller.success = null;
    controller.error   = null;
  }, 2000);

}]);

app.controller('test', function($scope) {
  $scope.show = false;
});

