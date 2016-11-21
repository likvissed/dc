(function() {
  app
    .service('Flash', Flash)                          // Сервис уведомлений пользователя (как об успешных операциях, так и об ошибках)
    .service('Error', Error)                          // Сервис обработки ошибок
    .factory('Server', Server)                        // Фабрика для работы с CRUD действиями
    .factory('GetDataFromServer', GetDataFromServer)  // Фабрика для работы с new и edit действиями
    .factory('myHttpInterceptor', myHttpInterceptor)  // Фабрика для настройки параметрв для индикатора выполнения ajax запросов
    .factory('Ability', Ability);                     // Хранит роль пользователя и проверяет права доступа к определенным объектам


  Flash.$inject             = ['$timeout'];
  Error.$inject             = ['Flash'];
  Server.$inject            = ['$resource'];
  GetDataFromServer.$inject = ['$http', '$q'];
  myHttpInterceptor.$inject = ['$q'];
  Ability.$inject           = ['$q', '$timeout', 'Server'];

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
          response.data ? Flash.alert(response.data.full_message) : Flash.alert(response.full_message);
          break;
        default:
          var descr = (response && response.statusText) ? ' (' + response.statusText + ')' : '';
          Flash.alert('Ошибка. Код: ' + code + descr + '. Обратитесь к администратору (тел. ***REMOVED***).');
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
      DetailType:     $resource('/detail_types/:id.json', {}, { update: { method: 'PATCH' } }),

      UserRole:       $resource('/users/role.json')
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
            })
            .error(function (data, status) {
              deferred.reject(status);
            });
        else
          $http.get('/' + ctrl_name + '/' + name + '/edit.json')
            .success(function (data, status, header, config) {
              deferred.resolve(data);
            })
            .error(function (data, status) {
              deferred.reject(status);
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

// =====================================================================================================================

  function Ability($q, $timeout, Server) {
    var
      role          = null, // Роль пользователя
      requestsCount = 0,    // Счетчик запросов (не делать новый запрос, если != 0, т.к. кто-то его уже сделал)
      count = 0,            // Счетчик прохода цикла функции timeout (если == limit, остановить цикл)
      limit = 400;            // Лимит, при котором необходимо остановить цикл проверки роли - 20 секунд (400 циклов).

// =============================================== Приватные функции ===================================================

    // Установить таймаут на случай, если счетчик requestsCount != 0, а role = null. Это значит, что кто-то уже выполнил
    // запрос на сервер для того, чтобы получить роль пользователя, но ответ еще не успел прийти.
    function waitingRole() {
      var deferred = $q.defer();

      timeout(deferred);

      return deferred.promise;
    }

    // Функция ожидания роли. Выполнять таймаут до тех пор, пока не изменится значение переменной role или не пройдет.
    function timeout (deferred) {
      $timeout(function () {
        // Если подошел лимит, но роль так и не получили
        if (count == limit) {
          count = 0;
          return role ? deferred.resolve(role) : deferred.reject(null);
        }

        count ++;

        if (!role)
          timeout(deferred);
        else {
          count = 0;
          return deferred.resolve(role);
        }
      }, 50);
    }

// =============================================== Публичные функции ===================================================

    return {
      // Инициализация
      init: function () {
        if (requestsCount != 0) {
          if (!role) {
            var deferred = $q.defer();

            waitingRole().then(
              function() {
                deferred.resolve(role);
              },
              function () {
                deferred.reject({ full_message: "Ошибка. Не удалось проверить роль. Попробуйте обновить страницу. Если ошибка не исчезнет, обратитесь к администратору (тел. ***REMOVED***)", status: 422 });
              });

            return deferred.promise;
          }
          else
            return $q.resolve(role);
        }

        requestsCount ++;
        return Server.UserRole.get({}).$promise;
      },
      // Установить роль
      setRole: function (new_role) {
        role = new_role
      },
      // Проверить право доступа
      canView: function (type) {
        switch (type) {
          case 'instr':
            return role == 'admin' || role == 'head';
          case 'admin_tools':
            return role == 'admin';
        }
      }
    };

    // Проверка прав доступа (сейчас не используется):
    // 1. Существует ли массив объектов с указанный правом (read, manage и т.д.)
    // 2. Имеется ли в найденном массиве указанный объект или объект 'all'. Если да - значит есть право доступа.
    // return (abilities && abilities[ability] && ($.inArray(model, abilities[ability]) != -1 || $.inArray('all', abilities[ability]) != -1)) ? true : false;
  }
})();