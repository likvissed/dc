app.directive('servForm', function($http) {
  return function(scope, element, attrs){
    // Новый сервер
    if (attrs.servForm == 0) {
      $http.get('/servers/new.json')
        .success(function(data, status, header, config) {
          scope.types = data;
          scope.server = {
            //server_type: scope.types[0]
          }
        })
        .error(function(data, status, header, config) {})
    }
    //Редактирование существующего сервера
    else {
      $http.get('/servers/' + attrs.servForm + '/edit.json')
        .success(function(data, status, header, config) {
          scope.server  = data.server;
          scope.types   = data.server_types;
          scope.details = data.server_details;
          scope.parts   = data.server_parts;
        });
    }
  };
});

app.controller('ServEditCtrl', function($scope, $http) {
  $scope.changeType = function(type) {
    $http.get('/server_types/' + type.name + '/edit.json')
      .success(function(data, status, header, config) {
        $scope.details = data.server_details;
        $.each($scope.details, function() {
          this.id = null; //Сбросить id для комплектующих шаблонного сервера
        });
        $scope.parts = data.server_parts;
      });
  }

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
