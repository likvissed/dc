(function () {
  'use strict';

  app
    .controller('NodeRoleIndexCtrl', NodeRoleIndexCtrl) // Таблица типов серверов
    .controller('NodeRoleEditCtrl', NodeRoleEditCtrl);  // Добавление/редактирование типа сервера

  NodeRoleIndexCtrl.$inject = ['$controller', '$scope', '$rootScope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error'];
  NodeRoleEditCtrl.$inject  = ['$scope', '$rootScope', 'Flash', 'Server', 'Error'];

// =====================================================================================================================

  /**
   * Управление таблицей типов серверов.
   *
   * @class DataCenter.NodeRoleIndexCtrl
   * @param $controller
   * @param $scope
   * @param $rootScope
   * @param $http
   * @param $compile
   * @param DTOptionsBuilder
   * @param DTColumnBuilder
   * @param Server - описание: {@link DataCenter.Server}
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function NodeRoleIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', {
        url: '/node_roles.json',
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-4"' +
          '<"#node_roles.new-record">>' +
        '<"col-sm-8 col-md-8 col-lg-4">' +
        '<"col-sm-2 col-md-2 col-lg-4"f>>' +
      't<"row"' +
        '<"col-md-6"i>' +
        '<"col-md-6"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-lg-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Типы серверов').withOption('className', 'col-lg-9'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-lg-1').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-lg-1').renderWith(delRecord)
    ];

    // Объекты типов серверов (id => data)
    var nodeRoles     = {};
    // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице
    var reloadPaging  = false;

// =============================================== Приватные функции ===================================================

    /**
     * Показать номер строки.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {*}
     * @private
     */
    function renderIndex(data, type, full, meta) {
      // Сохранить данные типа сервера (нужны для вывода пользователю информации об удаляемом элементе)
      nodeRoles[data.id] = data;
      return meta.row + 1;
    }

    /**
     * Callback после создания каждой строки.
     *
     * @param row
     * @param data
     * @param dataIndex
     * @private
     */
    function createdRow(row, data, dataIndex) {
      // Компиляция строки
      $compile(angular.element(row))($scope);
    }

    // Событие обновления таблицы после добавления/редактирования типа сервера
    $scope.$on('table:node_role:reload', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    /**
     * Отрендерить ссылку на изменение типа сервера.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="nodeRolePage.showNodeRoleModal(\'' +
        data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g' +
        ' pointer"></a>';
    }

    /**
     * Отрендерить ссылку на удаление типа сервера.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="nodeRolePage.destroyNodeRole(' + data.id +
        ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    /**
     * Открыть модальное окно для создания/редактирования типа сервера.
     *
     * @methodOf DataCenter.NodeRoleIndexCtrl
     * @param name - имя типа сервера
     */
    self.showNodeRoleModal = function (name) {
      var data = {
        method: '',
        value:  null
      };

      // Если запись редактируется
      if (name) {
        $http.get('/node_roles/' + name + '/edit.json')
          .success(function (success) {
            data.method = 'PUT';
            data.value  = angular.copy(success);

            $scope.$broadcast('node_role:edit', data);
          })
          .error(function (response, status) {
            Error.response(response, status);
          });
      }
      else {
        data.method = 'POST';

        $scope.$broadcast('node_role:edit', data);
      }
    };

    /**
     * Удалить тип сервера
     *
     * @methodOf DataCenter.NodeRoleIndexCtrl
     * @param id - id типа сервера
     * @returns {boolean}
     */
    self.destroyNodeRole = function (id) {
      var confirm_str = "Вы действительно хотите удалить тип сервера \"" + nodeRoles[id].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.NodeRole.delete({ id: id },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);

          // В случае успешного удаления из базы необходимо удалить тип из фильтра в таблице серверов.
          $rootScope.$emit('table:cluster:filter:node_role', { flag: 'delete', id: id });
        },
        // Error
        function (response) {
          Error.response(response);
        });
    }
  }

// =====================================================================================================================

  /**
   * Добавление/редактирование типа сервера.
   *
   * @class DataCenter.NodeRoleEditCtrl
   * @param $scope
   * @param $rootScope
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Server - описание: {@link DataCenter.Server}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function NodeRoleEditCtrl ($scope, $rootScope, Flash, Server, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.nodeRoleModal  = false;
    self.config         = {
      // Шапка модального окна
      title:  '',
      // Метод отправки запрос (POST, PATCH)
      method: ''
    };
    // Данные поля name в форме form
    self.value          = null;

    // Id изменяемого типа детали
    var id              = null;
    // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
    var errors          = null;
    // Шаблон данных (вызывается при создании нового типа сервера)
    var value_template  = { name: '' };

    $scope.$on('node_role:edit', function (event, data) {
      self.nodeRoleModal = true;
      self.config.method  = angular.copy(data.method);

      if (data.method == 'POST') {
        self.config.title   = 'Новый тип сервера';
        self.value          = angular.copy(value_template);
      }
      else {
        self.config.title   = angular.copy(data.value.name);
        self.value          = angular.copy(data.value);
        id                  = angular.copy(data.value.id);
      }

    });

// =============================================== Приватные функции ===================================================

    /**
     * Установить валидаторы на поля формы. В случае ошибок валидации пользователю будет предоставлено сообщение об
     * ошибке.
     *
     * @param array - объект, содержащий ошибки
     * @param flag - флаг, устанавливаемый в объект form (false - валидация не пройдена, true - пройдена)
     * @private
     */
    function setValidations(array, flag) {
      $.each(array, function (key, value) {
        $.each(value, function (index, message) {
          if (key != 'base')
            self.form['node_role[' + key + ']'].$setValidity(message, flag);
        });
      });
    }

    /**
     * Очистить модальное окно.
     *
     * @private
     */
    function clearForm() {
      self.value = angular.copy(value_template);
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }
    }

    /**
     * Действия в случае успешного создания/изменения типа сервера.
     *
     * @param response
     * @private
     */
    function successResponse(response) {
      self.nodeRoleModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    /**
     * Действия в случае ошибки создания/изменения типа сервера.
     *
     * @param response
     * @private
     */
    function errorResponse(response) {
      Error.response(response);

      errors = response.data.object;
      setValidations(errors, false);
    }

// =============================================== Публичные функции ===================================================

    /**
     * Добавить класс "has-error" к элементу форму.
     *
     * @methodOf DataCenter.NodeRoleEditCtrl
     * @param name
     * @returns {string}
     */
    self.errorClass = function (name) {
      return (self.form[name].$invalid) ? 'has-error': ''
    };

    /**
     * Добавить сообщение об ошибках валидации к элементу формы.
     *
     * @methodOf DataCenter.NodeRoleEditCtrl
     * @param name
     * @returns {string}
     */
    self.errorMessage = function (name) {
      var message = [];

      $.each(self.form[name].$error, function (key, value) {
        message.push(key);
      });

      return message.join(', ');
    };

    /**
     * Отправить данные формы на сервер.
     *
     * @methodOf DataCenter.NodeRoleEditCtrl
     */
    self.readyNodeRoleModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.NodeRole.save({ node_role: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:node_role:reload', { reload: true });
            // Добавить в фильтр таблицы серверов созданный тип
            $rootScope.$emit('table:cluster:filter:node_role', { flag: 'add', value: response.node_role });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.NodeRole.update({ id: id }, { node_role: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:node_role:reload', { reload: true });
            // Изменить имя типа в фильтре таблицы серверов
            $rootScope.$emit('table:cluster:filter:node_role', { flag: 'update', value: response.node_role });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    /**
     * Закрыть модальное окно по кнопке "Отмена".
     *
     * @methodOf DataCenter.NodeRoleEditCtrl
     */
    self.closeNodeRoleModal = function () {
      self.nodeRoleModal = false;
      clearForm();
    };
  }
})();