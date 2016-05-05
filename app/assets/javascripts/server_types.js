app.directive('servTypeForm', function($http) {
  return function(scope, element, attrs){
    if (attrs.servTypeForm == 0) {
      $http.get('/server_types/new.json')
        .success(function(data, status, header, config) {
          scope.parts = data;
          scope.details = [{
            server_part_id: scope.parts[0].id,
            server_part: scope.parts[0],
            count: 1
          }];
        });
    }
    else {
      scope.server_type = {
        name: $('#server_type_name').val()
      }
      $http.get('/server_types/' + attrs.servTypeForm + '/edit.json')
        .success(function(data, status, headers, config) {
          scope.details = data.server_details;
          scope.parts = data.server_parts;
        });
    }
  }
});

app.controller('ServEditTypeCtrl', function($scope, $http) {
  $scope.addServPart = function() {
    $scope.details.push({
      server_part_id: $scope.parts[0].id,
      server_part: $scope.parts[0],
      count: 1,
      destroy: 0
    });
  }

  $scope.delServPart = function(detail) {
    if (detail.id)
      detail.destroy = 1;
    else
      $scope.details.splice($.inArray(detail, $scope.details), 1)
  }
});
