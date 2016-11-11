(function () {
  'use strict';

  app
    .controller('NodeRoleIndexCtrl', NodeRoleIndexCtrl) // Таблица типов серверов
    .controller('NodeRoleEditCtrl', NodeRoleEditCtrl);  // Добавление/редактирование типа сервера

  NodeRoleIndexCtrl.$inject = ['$controller', '$scope', '$rootScope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  NodeRoleEditCtrl.$inject  = ['$scope', '$rootScope', 'Flash', 'Server'];

// =====================================================================================================================

  function NodeRoleIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', '/node_roles.json')
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

    var
      nodeRoles     = {},     // Объекты типов серверов (id => data)
      reloadPaging  = false;  // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      nodeRoles[data.id] = data; // Сохранить данные контакта (нужны для вывода пользователю информации об удаляемом элементе)
      return meta.row + 1;
    }

    function createdRow(row, data, dataIndex) {
      // Компиляция строки
      $compile(angular.element(row))($scope);
    }

    // Событие обновления таблицы после добавления/редактирования типа сервера
    $scope.$on('reloadNodeRoleData', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    // Отрендерить ссылку на изменение контакта
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="nodeRolePage.showNodeRoleModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g pointer"></a>';
    }

    // Отрендерить ссылку на удаление контакта
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="nodeRolePage.destroyNodeRole(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Открыть модальное окно для создания/редактирования типа сервера
    // name - имя типа сервера
    self.showNodeRoleModal = function (name) {
      var data = {
        method: '',
        value:  null
      };

      // Если запись редактируется
      if (name) {
        $http.get('/node_roles/' + name + '/edit.json').success(function (success) {
          data.method = 'PUT';
          data.value  = angular.copy(success);

          $scope.$broadcast('nodeRoleData', data);
        });
      }
      else {
        data.method = 'POST';

        $scope.$broadcast('nodeRoleData', data);
      }
    };

    // Удалить тип сервера
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
          $rootScope.$emit('changedNodeRole', { flag: 'delete', id: id });
        },
        // Error
        function (response) {
          Flash.alert(response.data.full_message);
        });
    }
  }

// =====================================================================================================================

  function NodeRoleEditCtrl ($scope, $rootScope, Flash, Server) {
    var self = this;

// =============================================== Инициализация =======================================================

    self.nodeRoleModal  = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config         = {
      title:  '',                 // Шапка модального окна
      method: ''                  // Метод отправки запрос (POST, PATCH)
    };
    self.value          = null; // Данные поля name в форме form

    var
      id              = null,   // Id изменяемого типа детали
      errors          = null,   // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
      value_template  = {       // Шаблон данных (вызывается при создании нового контакта)
        name: ''
      };

    $scope.$on('nodeRoleData', function (event, data) {
      self.nodeRoleModal = true;

      self.value          = angular.copy(data.value);
      self.config.method  = angular.copy(data.method);
      self.config.title   = data.method == 'POST' ? 'Новый тип сервера' : data.value.name;
      if (data.value)
        id = data.value.id;
    });

// =============================================== Приватные функции ===================================================

    // array - объект, содержащий ошибки
    // flag - флаг, устанавливаемый в объект form (false - валидация не пройдена, true - пройдена)
    function setValidations(array, flag) {
      $.each(array, function (key, value) {
        $.each(value, function (index, message) {
          if (key != 'base')
            self.form['node_role[' + key + ']'].$setValidity(message, flag);
        });
      });
    }

    // Очистить модальное окно
    function clearForm() {
      self.value = angular.copy(value_template);
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }
    }

    // Действия в случае успешного создания/изменения контакта
    function successResponse(response) {
      self.nodeRoleModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    // Действия в случае ошибки создания/изменения типа детали
    function errorResponse(response) {
      // Ошибка на стороне сервера
      if (parseInt(response.status) >= 500) {
        self.nodeRoleModal = false;
        Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        return false;
      }
      // Нет доступа
      else if (parseInt(response.status) == 403) {
        Flash.alert(response.data.full_message);
        return false;
      }

      errors = response.data.object;
      setValidations(errors, false);

      Flash.alert(response.data.full_message);
    }

// =============================================== Публичные функции ===================================================

    // Добавить класс "has-error" к элементу форму
    self.errorClass = function (name) {
      return (self.form[name].$invalid) ? 'has-error': ''
    };

    // Добавить сообщение об ошибках валидации к элементу формы
    self.errorMessage = function (name) {
      var message = [];

      $.each(self.form[name].$error, function (key, value) {
        message.push(key);
      });

      return message.join(', ');
    };

    // Отправить данные формы на сервер
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
            $scope.$emit('reloadNodeRoleData', { reload: true });
            // Добавить в фильтр таблицы серверов созданный тип
            $rootScope.$emit('changedNodeRole', { flag: 'add', value: response.node_role });
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
            $scope.$emit('reloadNodeRoleData', { reload: true });
            // Изменить имя типа в фильтре таблицы серверов
            $rootScope.$emit('changedNodeRole', { flag: 'update', value: response.node_role });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Закрыть модальное окно по кнопке "Отмена"
    self.closeNodeRoleModal = function () {
      self.nodeRoleModal = false;
      clearForm();
    };
  }
})();