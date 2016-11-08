(function () {
  'use strict';

  app
    .controller('ServerPartIndexCtrl', ServerPartIndexCtrl)       // Таблица комплектующих
    .controller('ServerPartPreviewCtrl', ServerPartPreviewCtrl)   // Режим предпросмотра комплектующей
    .controller('ServerPartEditCtrl', ServerPartEditCtrl);        // Добавление/редактирование комплектующих

  ServerPartIndexCtrl.$inject   = ['$controller', '$scope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  ServerPartPreviewCtrl.$inject = ['$scope'];
  ServerPartEditCtrl.$inject    = ['$scope', 'Flash', 'Server'];

// =====================================================================================================================

  function ServerPartIndexCtrl($controller, $scope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.previewModal   = false; // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', '/server_parts.json')
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"#server_parts.new-record">>' +
        '<"col-sm-8 col-md-8 col-lg-8">' +
        '<"col-sm-2 col-md-2 col-lg-2"f>>' +
      't<"row"' +
        '<"col-md-12"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Комплектующие').withOption('className', 'col-lg-6'),
      DTColumnBuilder.newColumn('detail_type.name').withTitle('Тип').withOption('className', 'col-lg-2'),
      DTColumnBuilder.newColumn('part_num').withTitle('Номер').withOption('className', 'col-lg-2'),
      DTColumnBuilder.newColumn(null).notSortable().withOption('className', 'text-center').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).notSortable().withOption('className', 'text-center').renderWith(delRecord)
    ];

    var
      serverParts   = {},     // Объекты комплектующих серверов (id => data)
      reloadPaging  = false;  // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      serverParts[data.id] = data;
      return meta.row + 1;
    }

    function createdRow(row, data, dataIndex) {
      // Создание события просмотра данных о формуляре
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServerPartData(data));
      });

      // Компиляция строк
      $compile(angular.element(row))($scope);
    }

    // Показать данные комплектующей
    function showServerPartData(row_data) {
      Server.ServerPart.get({ id: row_data.id },
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('showServerPartData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        });
    }

    // Событие обновления таблицы после добавления/редактирования комплектующей
    $scope.$on('reloadServerPartData', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    // Отрендерить ссылку на изменение контакта
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="serverPartPage.showServerPartModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g"></a>';
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPartPage.destroyServerPart(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Открыть модальное окно
    // name - имя комплектующей
    self.showServerPartModal = function (name) {
      var data = {
        method:       '',   // Протокол отправки сообщения (POST, PATCH)
        detail_types: null, // Все типы комплектующих
        value:        null  // Данные выбранной комплектующей
      };

      // Если запись редактируется
      if (name) {
        $http.get('/server_parts/' + name + '/edit.json').success(function (response) {
          data.method       = 'PUT';
          data.detail_types = angular.copy(response.detail_types);
          data.value        = angular.copy(response.data);

          $scope.$broadcast('editServerPartData', data);
        });
      }
      else {
        $http.get('/server_parts/new.json')
          .success(function (response) {
            data.method       = 'POST';
            data.detail_types = angular.copy(response.detail_types);
            data.value        = angular.copy(response.data);

            $scope.$broadcast('editServerPartData', data);
          })
          .error(function (response) {
            Flash.alert(response.data.full_message);
          });
      }
    };

    // Удалить сервис
    self.destroyServerPart = function (num) {
      var confirm_str = "Вы действительно хотите удалить комплектующую \"" + serverParts[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.ServerPart.delete({ id: num },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);
        },
        // Error
        function (response) {
          Flash.alert(response.data.full_message);
        });
    }
  }

// =====================================================================================================================

  function ServerPartPreviewCtrl($scope) {
    var self = this;

    $scope.$on('showServerPartData', function (event, data) {
      self.name     = data.name;
      self.type     = data.detail_type.name;
      self.number   = data.part_num;
      self.comment  = data.comment || 'Отсутствует';
    });
  }

// =====================================================================================================================

  function ServerPartEditCtrl($scope, Flash, Server) {
    var self = this;

// =============================================== Инициализация =======================================================

    self.serverPartModal  = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config           = {
      title:  '',                   // Шапка модального окна
      method: ''                    // Метод отправки запрос (POST, PATCH)
    };
    self.value = null;

    var
      id              = null,   // Id изменяемой комплектующей
      errors          = null,   // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
      value_template  = {       // Шаблон данных (вызывается при создании нового контакта)
        name:     '',
        part_num: '',
        comment:  ''
      };

    $scope.$on('editServerPartData', function (event, data) {
      self.serverPartModal = true;

      self.detail_types   = angular.copy(data.detail_types);
      self.value          = angular.copy(data.value);
      self.config.method  = angular.copy(data.method);
      self.config.title   = data.method == 'POST' ? 'Новая комплектующая' : data.value.name;
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
            self.form['server_part[' + key + ']'].$setValidity(message, flag);
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
      self.serverPartModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    // Действия в случае ошибки создания/изменения комплектующей
    function errorResponse(response) {
      // Ошибка на стороне сервера
      if (parseInt(response.status) >= 500) {
        self.serverPartModal = false;
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
    self.readyServerPartModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.ServerPart.save({ server_part: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('reloadServerPartData', { reload: true });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.ServerPart.update({ id: id }, self.value,
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('reloadServerPartData', { reload: true });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Закрыть модальное окно по кнопке "Отмена"
    self.closeServerPartModal = function () {
      self.serverPartModal = false;
      clearForm();
    };
  }
})();