(function () {
  'use strict';

  app
    .controller('DepartmentHeadCtrl', DepartmentHeadCtrl);

  DepartmentHeadCtrl.$inject = ['$controller', '$scope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error'];

  /**
   * Управление таблицей руководителей.
   *
   * @class DataCenter.DepartmentHeadCtrl
   * @param $controller
   * @param $scope
   * @param $http
   * @param $compile
   * @param DTOptionsBuilder
   * @param DTColumnBuilder
   * @param Server - описание: {@link DataCenter.Server}
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function DepartmentHeadCtrl($controller, $scope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance = {};
    self.dtOptions = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', {
        url: '/department_heads.json',
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('createdRow', createdRow)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-3 col-lg-2"' +
            '<"#department_heads.new-record">>' +
          '<"col-sm-8 col-md-6 col-lg-8">' +
          '<"col-sm-2 col-md-3 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-6"i>' +
          '<"col-md-6"p>>'
      );

    self.dtColumns = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('info').withTitle('ФИО').withOption('className', 'col-sm-8'),
      DTColumnBuilder.newColumn('dept').withTitle('Отдел').withOption('className', 'col-sm-1 text-center'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'col-sm-1 text-center').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'col-sm-1 text-center').renderWith(delRecord)
    ];
    // Объекты контактов (id => data)
    self.heads        = {};
    // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.headModal    = false;
    self.config       = {
      // Шапка модального окна
      title:  '',
      // Метод отправки запрос (POST, PATCH)
      method: ''
    };
    self.value        = angular.copy(value_template);

    // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице
    var reloadPaging    = false;
    // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
    var errors          = null;
    // Табельный номер редактируемого контакта
    var tn              = null;
    // Шаблон данных (вызывается при создании нового контакта)
    var value_template  = { tn: '' };

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
      self.heads[data.tn] = data; // Сохранить данные контакта (нужны для вывода пользователю информации об
      // удаляемом элементе)
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
    function createdRow (row, data, dataIndex) {
      $compile(angular.element(row))($scope);
    }

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
          if (key != 'base' && self.form['department_head[' + key + ']'])
            self.form['department_head[' + key + ']'].$setValidity(message, flag);
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
     * Действия в случае успешного создания/изменения руководителя.
     *
     * @param response
     * @private
     */
    function successResponse(response) {
      self.headModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    /**
     * Действия в случае ошибки создания/изменения руководителя.
     *
     * @param response
     * @private
     */
    function errorResponse(response) {
      Error.response(response);

      errors = response.data.object;
      setValidations(errors, false);
    }

    /**
     * Отрендерить ссылку на изменение руководителя.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="depHeadPage.showHeadModal(' + data.tn +
        ')" tooltip-placement="top" uib-tooltip="Редактировать контакт"><i class="fa fa-pencil-square-o fa-1g' +
        ' pointer"></a>';
    }

    /**
     * Отрендерить ссылку на удаление руководителя.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="depHeadPage.destroyHead(' + data.tn + ')"' +
        ' tooltip-placement="top" uib-tooltip="Удалить контакт"><i class="fa fa-trash-o fa-1g"></a>';
    }

  // =============================================== Публичные функции ===================================================

    /**
     * Открыть модальное окно.
     *
     * @methodOf DataCenter.DepartmentHeadCtrl
     * @param num
     */
    self.showHeadModal = function (num) {
      self.headModal  = true;
      tn              = num;

      // Если запись редактируется
      if (tn) {
        $http.get('/department_heads/' + tn + '/edit.json')
          .success(function (success) {
            self.config.method  = 'PUT';
            //Заполнить поля данными, полученными с сервера
            self.value          = angular.copy(success);
            self.config.title   = success.info;
          })
          .error(function (response, status) {
            Error.response(response, status);
          });
      }
      else {
        self.config.method  = 'POST';
        self.value          = angular.copy(value_template);
        self.config.title   = 'Новый руководитель';
      }
    };

    /**
     * Закрыть модальное окно по кнопке "Отмена".
     *
     * @methodOf DataCenter.DepartmentHeadCtrl
     */
    self.closeHeadModal = function () {
      self.headModal = false;
      clearForm();
    };

    /**
     * Добавить класс "has-error" к элементу форму.
     *
     * @methodOf DataCenter.DepartmentHeadCtrl
     * @param name
     * @returns {string}
     */
    self.errorClass = function (name) {
      return (self.form[name].$invalid) ? 'has-error': ''
    };

    /**
     * Добавить сообщение об ошибках валидации к элементу формы.
     *
     * @methodOf DataCenter.DepartmentHeadCtrl
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
     * @methodOf DataCenter.DepartmentHeadCtrl
     */
    self.readyHeadModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.DepartmentHead.save({ department_head: self.value },
          // Success
          function (response) {
            successResponse(response);

            self.dtInstance.reloadData(null, reloadPaging);
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.DepartmentHead.update({ tn: tn }, { department_head: self.value },
          // Success
          function (response) {
            successResponse(response);

            self.dtInstance.reloadData(null, reloadPaging);
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    /**
     * Удалить руководителя.
     *
     * @methodOf DataCenter.DepartmentHeadCtrl
     * @param num
     * @returns {boolean}
     */
    self.destroyHead = function (num) {
      var confirm_str = "Вы действительно хотите удалить руководителя \"" + self.heads[num].info + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.DepartmentHead.delete({ tn: num },
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

})();