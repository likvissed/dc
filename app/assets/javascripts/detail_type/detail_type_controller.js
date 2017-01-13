(function () {
  'use strict';

  app
    .controller('DetailTypeIndexCtrl', DetailTypeIndexCtrl) // Таблица типов комплектующих
    .controller('DetailTypeEditCtrl', DetailTypeEditCtrl);  // Добавление/редактирование типа комплектующей

  DetailTypeIndexCtrl.$inject = ['$controller', '$scope', '$rootScope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error'];
  DetailTypeEditCtrl.$inject  = ['$scope', '$rootScope', 'Flash', 'Server', 'Error'];

// =====================================================================================================================

  /**
   * Управление таблицей типов комплектующих.
   *
   * @class DataCenter.DetailTypeIndexCtrl
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
  function DetailTypeIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', {
        url: '/detail_types.json',
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-4"' +
          '<"#detail_types.new-record">>' +
        '<"col-sm-8 col-md-8 col-lg-4">' +
        '<"col-sm-2 col-md-2 col-lg-4"f>>' +
      't<"row"' +
        '<"col-md-6"i>' +
        '<"col-md-6"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-lg-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Типы комплектующих').withOption('className', 'col-lg-9'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-lg-1').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-lg-1').renderWith(delRecord)
    ];

    // Объекты типов комплектующих (id => data)
    var detailTypes   = {};
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
      // Сохранить данные типа комплектующей (нужны для вывода пользователю информации об удаляемом элементе)
      detailTypes[data.id] = data;
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

    // Событие обновления таблицы после добавления/редактирования типа комплектующей
    $scope.$on('table:detail_type:reload', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    /**
     * Отрендерить ссылку на изменение типа комплектующей.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="detailTypePage.showDetailTypeModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g pointer"></a>';
    }

    /**
     * Отрендерить ссылку на удаление типа комплектующей.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="detailTypePage.destroyDetailType(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    /**
     * Открыть модальное окно.
     *
     * @methodOf DataCenter.DetailTypeIndexCtrl
     * @param name - имя типа комплектующей
     */
    self.showDetailTypeModal = function (name) {
      var data = {
        method: '',
        value:  null
      };

      // Если запись редактируется
      if (name) {
        $http.get('/detail_types/' + name + '/edit.json')
          .success(function (success) {
            data.method = 'PUT';
            data.value  = angular.copy(success);

            $scope.$broadcast('detail_type:edit', data);
          })
          .error(function (response, status) {
            Error.response(response, status);
          });
      }
      else {
        data.method = 'POST';

        $scope.$broadcast('detail_type:edit', data);
      }
    };

    /**
     * Удалить тип детали.
     *
     * @methodOf DataCenter.DetailTypeIndexCtrl
     * @param id
     * @returns {boolean}
     */
    self.destroyDetailType = function (id) {
      var confirm_str = "Вы действительно хотите удалить тип комплектующей \"" + detailTypes[id].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.DetailType.delete({ id: id },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);

          // В случае успешного удаления из базы необходимо удалить тип из фильтра в таблице комплектующих.
          $rootScope.$emit('table:server_part:filter:detail_type', { flag: 'delete', id: id });
        },
        // Error
        function (response) {
          Error.response(response);
        });
    }
  }

// =====================================================================================================================

  /**
   * Добавление/редактирование типа комплектующей.
   *
   * @class DataCenter.DetailTypeEditCtrl
   * @param $scope
   * @param $rootScope
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Server - описание: {@link DataCenter.Server}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function DetailTypeEditCtrl ($scope, $rootScope, Flash, Server, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.detailTypeModal  = false;
    self.config           = {
      // Шапка модального окна
      title:  '',
      // Метод отправки запрос (POST, PATCH)
      method: ''
    };
    // Данные поля name в форме form
    self.value            = null;

    // Id изменяемого типа детали
    var id              = null;
    // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
    var errors          = null;
    // Шаблон данных (вызывается при создании нового типа комплектующей)
    var value_template  = { name: '' };

    $scope.$on('detail_type:edit', function (event, data) {
      self.detailTypeModal = true;

      self.value          = angular.copy(data.value);
      self.config.method  = angular.copy(data.method);

      if (data.method == 'POST') {
        self.config.title = 'Новый тип комплектующей';
        self.value        = angular.copy(value_template);
      }
      else {
        self.config.title = angular.copy(data.value.name);
        self.value        = angular.copy(data.value);
        id                = angular.copy(data.value.id);
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
            self.form['detail_type[' + key + ']'].$setValidity(message, flag);
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
     * Действия в случае успешного создания/изменения типа комплектующей.
     *
     * @param response
     * @private
     */
    function successResponse(response) {
      self.detailTypeModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    /**
     * Действия в случае ошибки создания/изменения типа комплектующей.
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
     * @methodOf DataCenter.DetailTypeEditCtrl
     * @param name
     * @returns {string}
     */
    self.errorClass = function (name) {
      return (self.form[name].$invalid) ? 'has-error': ''
    };

    /**
     * Добавить сообщение об ошибках валидации к элементу формы.
     *
     * @methodOf DataCenter.DetailTypeEditCtrl
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
     * @methodOf DataCenter.DetailTypeEditCtrl
     */
    self.readyDetailTypeModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.DetailType.save({ detail_type: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:detail_type:reload', { reload: true });
            // Добавить в фильтр таблицы комплектуюших созданный тип
            $rootScope.$emit('table:server_part:filter:detail_type', { flag: 'add', value: response.detail_type });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.DetailType.update({ id: id }, { detail_type: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:detail_type:reload', { reload: true });
            // Изменить имя типа в фильтре таблицы комплектуюших
            $rootScope.$emit('table:server_part:filter:detail_type', { flag: 'update', value: response.detail_type });
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
     * @methodOf DataCenter.DetailTypeEditCtrl
     */
    self.closeDetailTypeModal = function () {
      self.detailTypeModal = false;
      clearForm();
    };
  }
})();