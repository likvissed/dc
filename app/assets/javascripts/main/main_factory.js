(function() {
  app
    .service('Flash', Flash)
    .factory('Server', Server)
    .factory('GetDataFromServer', GetDataFromServer);

  Flash.$inject             = ['$timeout'];
  Server.$inject            = ['$resource'];
  GetDataFromServer.$inject = ['$http', '$q'];

  // Уведомления (успешные действия и ошибки) для пользователя
  function Flash($timeout) {
    var self = this;

    self.flash = {
      notice: '',
      alert:  ''
    };

    self.notice = function (message) {
      self.flash.alert  = null;
      self.flash.notice = message;

      $timeout(function () {
        self.flash.notice = null;
      }, 2000);
    };

    self.alert = function (message) {
      self.flash.notice = null;
      self.flash.alert  = message;
    };
  }

  // Ресурс с CRUD actions
  function Server($resource) {
    return {
      Service:        $resource('/services/:id.json'),
      Contact:        $resource('/contacts/:tn.json', {}, { update: { method: 'PATCH' } }),
      DepartmentHead: $resource('/department_heads/:tn.json', {}, { update: { method: 'PATCH' } }),

      Cluster:        $resource('/clusters/:id.json', {}, { update: { method: 'PATCH' } }),

      Server:         $resource('/servers/:id.json'),
      ServerType:     $resource('/server_types/:id.json'),
      ServerPart:     $resource('/server_parts/:id.json', {}, { update: { method: 'PATCH' } }),
      DetailType:     $resource('/detail_types/:id.json', {}, { update: { method: 'PATCH' } })
    }
  }

  // Фабрика для запросов на сервер на new и edit actions
  // ctrl_name - имя контроллера, на который отправляется запрос
  // id - id записи, определяющий, создается новая запись или редактируется существующая (0 - новая запись, id не существует)
  // name - имя записи, данные к оторой необходимо найти
  function GetDataFromServer($http, $q) {
    return {
      ajax: function (ctrl_name, id, name) {
        var deferred = $q.defer(); // создаем экземпляр должника

        if (id == 0)
          $http.get('/' + ctrl_name + '/new.json')
            .success(function (data, status, header, config) {
              deferred.resolve(data);
            });
        else
          $http.get('/' + ctrl_name + '/' + name + '/edit.json')
            .success(function (data, status, header, config) {
              deferred.resolve(data);
            });

        return deferred.promise;
      }
    };
  }
})();