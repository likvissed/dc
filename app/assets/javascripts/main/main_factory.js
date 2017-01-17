(function() {
  app
    .service('Flash', Flash)                          // Сервис уведомлений пользователя (как об успешных операциях,
    // так и об ошибках)
    .service('Error', Error)                          // Сервис обработки ошибок
    .service('Ability', Ability)                      // Хранит роль пользователя и проверяет права доступа к
    // определенным объектам
    .factory('Server', Server)                        // Фабрика для работы с CRUD действиями
    .factory('GetDataFromServer', GetDataFromServer)  // Фабрика для работы с new и edit действиями
    .factory('myHttpInterceptor', myHttpInterceptor); // Фабрика для настройки параметрв для индикатора выполнения
    // ajax запросов


  Flash.$inject             = ['$timeout'];
  Error.$inject             = ['Flash'];
  Ability.$inject           = ['$q', '$timeout', 'Server'];
  Server.$inject            = ['$resource'];
  GetDataFromServer.$inject = ['$http', '$q'];
  myHttpInterceptor.$inject = ['$q'];

// =====================================================================================================================

  /**
   * Сервис уведомления пользователей как об успешных операциях, так и об ошибочных.
   *
   * @class DataCenter.Flash
   * @param $timeout
   */
  function Flash($timeout) {
    var self = this;

    self.flash = {
      notice: '',
      alert:  ''
    };

    /**
     * Показать notice уведомление и скрыть его через 2 секунды.
     *
     * @methodOf DataCenter.Flash
     * @param message - сообщение, которое необходимо вывести
     */
    self.notice = function (message) {
      self.flash.alert  = null;
      self.flash.notice = message;

      $timeout(function () {
        self.flash.notice = null;
      }, 2000);
    };

    /**
     * Показать alert уведомление.
     *
     * @methodOf DataCenter.Flash
     * @param message - сообщение, которое необходимо вывести
     */
    self.alert = function (message) {
      self.flash.notice = null;
      self.flash.alert  = message;
    };
  }

// =====================================================================================================================

  /**
   * Сервис обработки ошибок, полученных с сервера.
   *
   * @class DataCenter.Error
   * @param Flash
   */
  function Error(Flash) {
    var self = this;

    /**
     * Обработать ответ сервера, содержащий ошибку и вывести сообщение об ошибке пользователю.
     *
     * @methodOf DataCenter.Error
     * @param response - объект, содержащий ответ сервера
     * @param status - статус ответа (необязательный параметр, используется, если не удается найти статус в
     * параметре "response")
     */
    self.response = function (response, status) {
      var code; // код ответа

      code = (response && response.status) ? parseInt(response.status): parseInt(status);

      switch(code) {
        case 401:
          Flash.alert('Ваш сеанс закончился. Пожалуйста, войдите в систему снова.');
          break;
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

  /**
   * Сервис для хранения роли пользователя и проверки права доступа к определенным объектам.
   *
   * @class DataCenter.Ability
   * @param $q
   * @param $timeout
   * @param Server
   */
  function Ability($q, $timeout, Server) {
    var self = this;

    // Роль пользователя
    var role          = null;
    // Счетчик запросов (не делать новый запрос, если != 0, т.к. кто-то его уже сделал)
    var requestsCount = 0;
    // Счетчик прохода цикла функции timeout (если == limit, остановить цикл)
    var count         = 0;
    // Лимит, при котором необходимо остановить цикл проверки роли = 20 секунд (400 циклов).
    var limit         = 400;

    /**
     * Функция, устанавливающая таймаут на случай, если счетчик requestsCount != 0, а role = null. Это значит, что
     * запрос на получение роли пользователя уже ушел, но ответ еще не успел прийти.
     *
     * @returns promise
     * @private
     */
    function waitingRole() {
      var deferred = $q.defer();

      timeout(deferred);

      return deferred.promise;
    }

    /**
     * Функция ожидания роли. Выполнять таймаут до тех пор, пока не изменится значение переменной role или счетчик
     * не дойдет до лимита.
     *
     * @param deferred
     * @private
     */
    function timeout(deferred) {
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

    /**
     * Инициализация: проверка наличия роли; запрос на сервер, если роль отсутвтует.
     *
     * @methodOf DataCenter.Ability
     * @returns promise
     */
    self.init = function () {
      if (requestsCount != 0) {
        if (!role) {
          var deferred = $q.defer();

          waitingRole().then(
            function() {
              deferred.resolve(role);
            },
            function () {
              deferred.reject({ full_message: "Ошибка. Не удалось проверить роль. Попробуйте обновить страницу. Если" +
              " ошибка не исчезнет, обратитесь к администратору (тел. ***REMOVED***)", status: 422 });
            });

          return deferred.promise;
        }
        else
          return $q.resolve({ role: role });
      }

      requestsCount ++;
      return Server.UserRole.get({}).$promise;
    };

    /**
     * Установить роль.
     *
     * @methodOf DataCenter.Ability
     * @param new_role - роль, которую необходимо установить пользователю
     */
    self.setRole = function (new_role) {
      role = new_role;
    };

    /**
     * Получить текущую роль пользователя
     *
     * @methodOf DataCenter.Ability
     * @returns role
     */
    self.getRole = function () {
      return role;
    };

    /**
     * Проверка прав доступа к объекту.
     *
     * @methodOf DataCenter.Ability
     * @param type - тип объекта, к которому запрашивается доступ
     * @returns {boolean}
     */
    self.canView = function (type) {
      switch (type) {
        case 'instr':
          return role == 'admin' || role == 'head';
        case 'admin_tools':
          return role == 'admin';
      }
    };

    // Проверка прав доступа (сейчас не используется):
    // 1. Существует ли массив объектов с указанный правом (read, manage и т.д.)
    // 2. Имеется ли в найденном массиве указанный объект или объект 'all'. Если да - значит есть право доступа.
    // return (abilities && abilities[ability] && ($.inArray(model, abilities[ability]) != -1 || $.inArray('all',
    // abilities[ability]) != -1)) ? true : false;
  }

// =====================================================================================================================

  /**
   * Фабрика для работы с CRUD действиями
   *
   * @class DataCenter.Server
   * @param $resource
   */
  function Server($resource) {
    return {
      /**
       * Ресурс модели сервисов (формуляров)
       *
       * @memberOf DataCenter.Server
       */
      Service:        $resource('/services/:id.json'),
      /**
       * Ресурс модели контактов
       *
       * @memberOf DataCenter.Server
       */
      Contact:        $resource('/contacts/:tn.json', {}, { update: { method: 'PATCH' } }),
      /**
       * Ресурс модели руководителей
       *
       * @memberOf DataCenter.Server
       */
      DepartmentHead: $resource('/department_heads/:tn.json', {}, { update: { method: 'PATCH' } }),

      /**
       * Ресурс модели кластеров
       *
       * @memberOf DataCenter.Server
       */
      Cluster:        $resource('/clusters/:id.json', {}, { update: { method: 'PATCH' } }),
      /**
       * Ресурс модели типов кластеров
       *
       * @memberOf DataCenter.Server
       */
      NodeRole:       $resource('/node_roles/:id.json', {}, { update: { method: 'PATCH' } }),

      /**
       * Ресурс модели серверов
       *
       * @memberOf DataCenter.Server
       */
      Server:         $resource('/servers/:id.json'),
      /**
       * Ресурс модели типов серверов
       *
       * @memberOf DataCenter.Server
       */
      ServerType:     $resource('/server_types/:id.json'),
      /**
       * Ресурс модели комплектующих
       *
       * @memberOf DataCenter.Server
       */
      ServerPart:     $resource('/server_parts/:id.json', {}, { update: { method: 'PATCH' } }),
      /**
       * Ресурс модели типов комплектующих
       *
       * @memberOf DataCenter.Server
       */
      DetailType:     $resource('/detail_types/:id.json', {}, { update: { method: 'PATCH' } }),

      /**
       * Ресурс модели ролей пользователей
       *
       * @memberOf DataCenter.Server
       */
      UserRole:       $resource('/users/role.json')
    }
  }

// =====================================================================================================================

  /**
   * Фабрика для обработки запросов на сервер для действий new и edit.
   *
   * @class DataCenter.GetDataFromServer
   * @param $http
   * @param $q
   */
  function GetDataFromServer($http, $q) {
    return {
      /**
       * Выполняет ajax запрос на сервер
       *
       * @memberOf DataCenter.GetDataFromServer
       * @param ctrl_name - имя контроллера, на который отправляется запрос
       * @param id - id записи, определяющий, создается новая запись или редактируется существующая (0 - новая запись,
       * id не существует)
       * @param name - имя записи, данные к оторой необходимо найти
       * @returns {Promise}
       */
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

  /**
   * Фабрика для настройки параметрв для индикатора выполнения ajax запросов
   *
   * @class DataCenter.myHttpInterceptor
   * @param $q
   */
  function myHttpInterceptor($q) {
    var self = this;

    self.requests = {
      count: 0
    };

    /**
     * Увеличить счетчик запросов
     *
     * @private
     */
    function incCount() {
      self.requests.count ++;
    }

    /**
     * Уменьшить счетчик запросов
     *
     * @private
     */
    function decCount() {
      self.requests.count --;
    }

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