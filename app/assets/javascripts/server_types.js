var app = angular.module('serverType', []);
app.directive('stopClick', function() {
  return function(scope, element, attrs) {
    element.click(function(event) {
      event.preventDefault();
    })
  }
});

app.directive('typeForm', function($http) {
  return function(scope, element, attrs){
    if (attrs.typeForm == 0) {
      $http.get('/server_types/new.json')
        .success(function(data, status, header, config) {
          scope.parts = data;
          scope.details = [{
            server_part_id: scope.parts[0].id,
            server_part: scope.parts[0],
            count: 1
          }];
        })
        .error(function(data, status, headers, config) {
        });
    }
    else {
      scope.server_type = {
        name: $('#server_type_name').val()
      }
      $http.get('/server_types/' + attrs.typeForm + '/edit.json')
        .success(function(data, status, headers, config) {
          scope.details = data.detail_types;
          scope.parts = data.server_parts;
        })
        .error(function(data, status, headers, config) {
        });
    }
  }
});

app.controller('EditCtrl', function($scope, $http) {
  $scope.add = function() {
    $scope.details.push({
      server_part_id: $scope.parts[0].id,
      server_part: $scope.parts[0],
      count: 1,
      destroy: 0
    });
    console.log($scope.details);
  }

  $scope.del = function(detail) {
    if (detail.id)
      detail.destroy = 1;
    else
      $scope.details.splice($.inArray(detail, $scope.details), 1)
    console.log($scope.details);
  }
});
