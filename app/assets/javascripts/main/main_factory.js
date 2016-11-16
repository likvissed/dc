(function() {
  app
    .service('Flash', Flash)                          // Сервис уведомлений пользователя (как об успешных операциях, так и об ошибках)
    .service('Error', Error)                          // Сервис обработки ошибок
    .factory('Server', Server)                        // Фабрика для работы с CRUD действиями
    .factory('GetDataFromServer', GetDataFromServer)  // Фабрика для работы с new и edit действиями
    .factory('myHttpInterceptor', myHttpInterceptor); // Фабрика для настройки параметрв для индикатора выполнения ajax запросов

  Flash.$inject             = ['$timeout'];
  Error.$inject             = ['Flash'];
  Server.$inject            = ['$resource'];
  GetDataFromServer.$inject = ['$http', '$q'];
  //myHttpInterceptor.$inject = ['q'];

// =====================================================================================================================

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

// =====================================================================================================================

  function Error(Flash) {
    var self = this;

    self.response = function (response, status) {
      var code; // код ответа

      code = (response && response.status) ? parseInt(response.status): parseInt(status);

      switch(code) {
        case 403:
          Flash.alert('Доступ запрещен.');
          break;
        case 404:
          Flash.alert('Запись не найдена.');
          break;
        case 422:
          Flash.alert(response.data.full_message);
          break;
        default:
          var descr = (response && response.statusText) ? ' (' + response.statusText + ')' : '';
          Flash.alert('Ошибка. Код: ' + code + descr + '. Обратитесь к администратору.');
          break;
      }
    };
  }

// =====================================================================================================================

  function Server($resource) {
    return {
      Service:        $resource('/services/:id.json'),
      Contact:        $resource('/contacts/:tn.json', {}, { update: { method: 'PATCH' } }),
      DepartmentHead: $resource('/department_heads/:tn.json', {}, { update: { method: 'PATCH' } }),

      Cluster:        $resource('/clusters/:id.json', {}, { update: { method: 'PATCH' } }),
      NodeRole:       $resource('/node_roles/:id.json', {}, { update: { method: 'PATCH' } }),

      Server:         $resource('/servers/:id.json'),
      ServerType:     $resource('/server_types/:id.json'),
      ServerPart:     $resource('/server_parts/:id.json', {}, { update: { method: 'PATCH' } }),
      DetailType:     $resource('/detail_types/:id.json', {}, { update: { method: 'PATCH' } })
    }
  }

// =====================================================================================================================

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

// =====================================================================================================================

  function myHttpInterceptor($q) {
    var self = this;

    self.requests = {
      count: 0
    };

// =============================================== Приватные функции ===================================================

    // Увеличить счетчик запросов
    function incCount() {
      self.requests.count ++;
    }

    // Уменьшить счетчик запросов
    function decCount() {
      self.requests.count --;
    }

// =============================================== Публичные функции ===================================================

    return {
      getRequestsCount: self.requests,
      incCount: function () {
        incCount();
      },
      decCount: function () {
        decCount();
      },
      request: function(config) {
        incCount();

        return config;
      },
      requestError: function(rejection) {
        decCount();

        return $q.reject(rejection);
      },
      response: function(response) {
        decCount();

        return response;
      },
      responseError: function(rejection) {
        decCount();

        return $q.reject(rejection);
      }
    };
  }

})();