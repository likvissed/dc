(function () {
  'use strict';

  app
    .controller('ServerPartIndexCtrl', ServerPartIndexCtrl)       // Таблица комплектующих
    .controller('ServerPartPreviewCtrl', ServerPartPreviewCtrl)   // Режим предпросмотра комплектующей
    .controller('ServerPartEditCtrl', ServerPartEditCtrl);        // Добавление/редактирование комплектующих

  ServerPartIndexCtrl.$inject   = ['$controller', '$scope', '$rootScope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error', 'Ability'];
  ServerPartPreviewCtrl.$inject = ['$scope'];
  ServerPartEditCtrl.$inject    = ['$scope', 'Flash', 'Server', 'Error'];

// =====================================================================================================================

  function ServerPartIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.typeOptions    = [ // Массив фильтра по типу комплектующих (данные берутся с сервера)
      {
        id:   0,
        name: 'Все типы'
      }
    ];
    self.selectedTypeOption = self.typeOptions[0];
    self.previewModal   = false; // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withDataProp('data')
      .withOption('ajax', {
        url:  '/server_parts.json',
        data: { detailTypes:  true },
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"#server_parts.new-record">>' +
        '<"col-sm-6 col-md-6 col-lg-6">' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"detail-type-filter">>' +
        '<"col-sm-2 col-md-2 col-lg-2"f>>' +
      't<"row"' +
        '<"col-md-6"i>' +
        '<"col-md-6"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Комплектующие').withOption('className', 'col-lg-6'),
      DTColumnBuilder.newColumn('detail_type.name').withTitle('Тип').withOption('className', 'col-lg-2'),
      DTColumnBuilder.newColumn('part_num').withTitle('Номер').withOption('className', 'col-lg-3'),
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

    function initComplete(settings, json) {
      var api = new $.fn.dataTable.Api(settings);

      Ability.init()
        .then(
          function (data) {
            // Записать в фабрику
            Ability.setRole(data.role);

            // Показать инструкции и иконки урпавления только для определенных ролей
            api.column(4).visible(Ability.canView('admin_tools'));
            api.column(5).visible(Ability.canView('admin_tools'));
          },
          function (response, status) {
            Error.response(response, status);

            // Удалить все данные в случае ошибки проверки прав доступа
            api.rows().remove().draw();
          });

      // Заполнить список фильтра типов комплектующих
      if (json.detail_types) {
        self.typeOptions        = self.typeOptions.concat(json.detail_types);
        self.selectedTypeOption = self.typeOptions[0];
      }
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
          // Отправить данные контроллеру ServerPartPreviewCtrl
          $scope.$broadcast('showServerPartData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    // Отрендерить ссылку на изменение комплектующей
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="serverPartPage.showServerPartModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g pointer"></a>';
    }

    // Отрендерить ссылку на удаление комплектующей
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPartPage.destroyServerPart(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

    // Выполнить запрос на сервер с учетом выбранных фильтров
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/server_parts.json',
        data: {
          typeFilter: self.selectedTypeOption.id
        }
      });
    }

    // Событие обновления таблицы после добавления/редактирования комплектующей
    $scope.$on('reloadServerPartData', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    // Событие обновления фильтра и обновления таблицы (если это необходимо)
    // data.flag - флаг, определяющий, удалять, изменять или добавлять элементы в фильтра
    // add - добавить
    // delete - удалить
    // update - изменить. После изменения необходимо обновить таблицу для того, чтобы новое имя типа отобразилось в самое таблице.
    $rootScope.$on('changedDetailType', function (event, data) {
      // Удалить тип сервера из фильтра таблицы комплектующих
      if (data.flag == 'delete') {
        var obj = $.grep(self.typeOptions, function (elem) { return elem.id == data.id });
        self.typeOptions.splice($.inArray(obj[0], self.typeOptions), 1);
      }

      // Добавить созданный тип в фильтр таблицы комплектующих
      else if (data.flag == 'add')
        self.typeOptions.push(data.value);

      // Изменить имя типа
      else if (data.flag == 'update') {
        $.each(self.typeOptions, function (index, value) {
          if (data.value.id == value.id) {
            value.name = data.value.name;
            return false;
          }
        });
        self.dtInstance.reloadData(null, reloadPaging);
      }
    });

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      newQuery();
    };

    // Открыть модальное окно для создания/редактирования комплектующей
    // name - имя комплектующей
    self.showServerPartModal = function (name) {
      var data = {
        method:       '',   // Протокол отправки сообщения (POST, PATCH)
        detail_types: null, // Все типы комплектующих
        value:        null  // Данные выбранной комплектующей
      };

      // Если запись редактируется
      if (name) {
        $http.get('/server_parts/' + name + '/edit.json')
          .success(function (response) {
            data.method       = 'PUT';
            data.detail_types = angular.copy(response.detail_types);
            data.value        = angular.copy(response.data);

            $scope.$broadcast('editServerPartData', data);
          })
          .error(function (response, status) {
            Error.response(response, status);
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
          .error(function (response, status) {
            Error.response(response, status);
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
          Error.response(response);
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

  function ServerPartEditCtrl($scope, Flash, Server, Error) {
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
      self.config.method  = angular.copy(data.method);

      if (data.method == 'POST') {
        self.config.title = 'Новая комплектующая';
        self.value        = angular.copy(value_template);
      }
      else {
        self.config.title = angular.copy(data.value.name);
        self.value        = angular.copy(data.value);
        id                = angular.copy(data.value.id);
      }
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
      Error.response(response);

      errors = response.data.object;
      setValidations(errors, false);
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
        Server.ServerPart.update({ id: id }, { server_part: self.value },
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