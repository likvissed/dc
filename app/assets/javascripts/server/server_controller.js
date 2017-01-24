(function () {
  'use strict';

  app
    .controller('ServerIndexCtrl', ServerIndexCtrl)         // Общая таблица оборудования
    .controller('ServerTotalInfoCtrl', ServerTotalInfoCtrl) // Общая информация об оборудовании
    .controller('ServerPreviewCtrl', ServerPreviewCtrl)     // Предпросмотр оборудования
    .controller('ServerEditCtrl', ServerEditCtrl);          // Форма добавления/редактирования оборудования

  ServerIndexCtrl.$inject   = ['$controller', '$scope', '$rootScope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Cookies', 'Error', 'Ability'];
  ServerPreviewCtrl.$inject = ['$scope'];
  ServerEditCtrl.$inject    = ['$http', 'GetDataFromServer', 'Error'];

// =====================================================================================================================

  /**
   * Управление общей таблицей оборудования.
   *
   * @class DataCenter.ServerIndexCtrl
   * @param $controller
   * @param $scope
   * @param $rootScope
   * @param $location
   * @param $compile
   * @param DTOptionsBuilder
   * @param DTColumnBuilder
   * @param Server - описание: {@link DataCenter.Server}
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Cookies - описание: {@link DataCenter.Cookies}
   * @param Error - описание: {@link DataCenter.Error}
   * @param Ability - описание: {@link DataCenter.Ability}
   */
  function ServerIndexCtrl($controller, $scope, $rootScope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Cookies, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});
    // Инициализация cookies
    Cookies.Server.init();

    // Массив фильтра по статусу оборудования
    self.statusOptions = [
      {
        value:  'all',
        string: 'Все статусы'
      }
    ];
    // Массив фильтра по типу оборудования (данные берутся с сервера)
    self.typeOptions    = [
      {
        id:   0,
        name: 'Все типы'
      }
    ];
    // Выбранный статус оборудования
    // self.selectedStatusOption = self.statusOptions[0];
    self.selectedStatusOption = !Cookies.Server.get('serverStatusFilter') ? self.statusOptions[0].value : Cookies.Server.get('serverStatusFilter');
    // Выбранный тип оборудования
    self.selectedTypeOption = !Cookies.Server.get('serverTypeFilter') ? self.typeOptions[0].id : Cookies.Server.get('serverTypeFilter');
    // Флаг, скрывающий модальное окно
    self.previewModal   = false;
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('stateSave', true)
      .withDataProp('data')
      .withOption('ajax', {
        url:  '/servers.json',
        data: {
          // Флаг, необходимый, чтобы получить с сервера все типы оборудования
          serverTypes:  true,
          // Флаг, необходимый, чтобы получить с сервера все статусы оборудования
          serverStatuses:  true,
          statusFilter: self.selectedStatusOption,
          typeFilter:   self.selectedTypeOption
        },
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-1"' +
            '<"#servers.new-record">>' +
          '<"col-sm-2 col-md-2 col-lg-5">' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"server-type-filter">>' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"server-status-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-6"i>' +
          '<"col-md-6"p>>'
      );
    // Объекты оборудования (id => data)
    self.servers    = {};
    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-lg-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('inventory_num').withTitle('Инвентарный номер'),
      DTColumnBuilder.newColumn('server_type.name').withTitle('Тип').withOption('className', 'col-lg-3'),
      DTColumnBuilder.newColumn('status').withTitle('Статус').withOption('className', 'col-lg-2'),
       DTColumnBuilder.newColumn('location').withTitle('Расположение').withOption('className', 'col-lg-2'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-lg-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Сразу же включить режим предпросмотра ===============================

    var params = $location.absUrl().match(/servers\?id=(\d+)/);
    if (params)
      showServerData(params[1]);

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
      self.servers[data.id] = data;
      return meta.row + 1;
    }

    /**
     * Callback после инициализации таблицы, получения данных (не ajax, т.к. ajax происходит асинхронно) и
     * построения таблицы.
     *
     * @param settings
     * @param json
     * @private
     */
    function initComplete(settings, json) {
      var api = new $.fn.dataTable.Api(settings);

      Ability.init()
        .then(
          function (data) {
            // Записать в фабрику
            Ability.setRole(data.role);

            // Показать иконки управления только для определенных ролей
            api.column(5).visible(Ability.canView('admin_tools'));
          },
          function (response, status) {
            Error.response(response, status);

            // Удалить все данные в случае ошибки проверки прав доступа
            api.rows().remove().draw();
          });

      // Показать иконки управления только для определенных ролей
      api.column(5).visible(Ability.canView('admin_tools'));

      // Заполнить список фильтра типов оборудования
      if (json.server_types) {
        self.typeOptions        = self.typeOptions.concat(json.server_types);
        self.selectedTypeOption = !Cookies.Server.get('serverTypeFilter') ? self.typeOptions[0].id : Cookies.Server.get('serverTypeFilter');
      }

      if (json.statuses) {
        self.statusOptions        = self.statusOptions.concat(json.statuses);
        self.selectedStatusOption = !Cookies.Server.get('serverStatusFilter') ? self.statusOptions[0].value : Cookies.Server.get('serverStatusFilter');
      }
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
      // Событие click для просмотра информации об оборудовании
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServerData(data.id));
      });

      // Компиляция строки
      $compile(angular.element(row))($scope);
    }

    /**
     * Показать данные оборудования.
     *
     * @param id - id оборудования
     * @private
     */
    function showServerData(id) {
      Server.Server.get({ id: id },
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('server:show', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    /**
     * Отрендерить ссылку на удаление оборудования.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPage.destroyServer(' + data.id + ')"' +
        ' tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

    /**
     * Выполнить запрос на сервер с учетом выбранных фильтров.
     *
     * @private
     */
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/servers.json',
        data: {
          statusFilter: self.selectedStatusOption,
          typeFilter:   self.selectedTypeOption
        }
      });
    }

    /*
    $rootScope.$on('table:server:filter:server_type:delete', function (event, data) {
      // Удалить тип оборудования из фильтра таблицы оборудования
      var obj = $.grep(self.typeOptions, function (elem) { return elem.id == data });
      self.typeOptions.splice($.inArray(obj[0], self.typeOptions), 1);
    });
    */

// =============================================== Публичные функции ===================================================

    /**
     * Выполнить запрос на сервер после изменения фильтра.
     *
     * @methodOf DataCenter.ServerIndexCtrl
     */
    self.changeFilter = function () {
      Cookies.Server.set('serverStatusFilter', self.selectedStatusOption);
      Cookies.Server.set('serverTypeFilter', self.selectedTypeOption);

      newQuery();
    };

    /**
     * Удалить оборудование.
     *
     * @methodOf DataCenter.ServerIndexCtrl
     * @param num - id оборудования
     * @returns {boolean}
     */
    self.destroyServer = function (num) {
      var confirm_str = "Вы действительно хотите удалить оборудование \"" + self.servers[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Server.delete({ id: num },
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

  function ServerTotalInfoCtrl() {

  }

// =====================================================================================================================

  /**
   * Управление предпросмотром оборудования.
   *
   * @class DataCenter.ServerPreviewCtrl
   * @param $scope
   */
  function ServerPreviewCtrl($scope) {
    var self = this;

    $scope.$on('server:show', function (event, data) {
      // Статус
      self.status         = data.status;
      // Расположение
      self.location       = data.location;
      if (data.server_type)
        // Тип оборудования
        self.type         = data.server_type.name;

      // В состав какого сервера входит
      self.cluster = data.clusters;
      // Инвентарный номер
      self.inventory_num  = data.inventory_num;
      // Серийный номер
      self.serial_num     = data.serial_num;
      // Комментарий
      self.comment        = data.comment;
      // Количество комплектующих
      self.presenceCount = 0;

      self.title = self.inventory_num;
      switch (self.status) {
        case 'В работе':
          self.title += ' <span class="label label-success">В работе</span>';
          break;
        case 'В тесте':
          self.title += ' <span class="label label-warning">В тесте</span>';
          break;
        case 'Не используется':
          self.title += ' <span class="label label-default">Не используется</span>';
          break;
        default:
          break;
      }


      // Список комплектующих оборудования
      self.details = [];
      $.each(data.real_server_details, function (index, value) {
        self.details.push({
          name:   value.server_part.name,
          type:   value.server_part.detail_type.name,
          count:  value.count
        });

        self.presenceCount ++;
      });
    });
  }

// =====================================================================================================================

  /**
   * Форма добавления/редактирования оборудования.
   *
   * @class DataCenter.ServerEditCtrl
   * @param $http
   * @param GetDataFromServer - описание: {@link DataCenter.GetDataFromServer}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function ServerEditCtrl($http, GetDataFromServer, Error) {
    var self = this;

    // Объект вида { Имя => Кол-во комплектующих }
    self.presenceCount  = {};
    // Индекс последнего элемента формы. Используется для того, чтобы знать, какой индекс указывать для следующего
    // элемента.
    var lastIndex       = 0;

    // Получить текущее кол-во комплектующих для кжадого типа комплектующей
    function getDeatilsCount() {
      $.each(self.detailTypes, function (index, value) {
        self.presenceCount[value.name] = 0;

        if (self.data.real_server_details[value.name])
          $.each(self.data.real_server_details[value.name], function (index, in_value) {
            if (in_value.destroy == 0 || !in_value.destroy)
              self.presenceCount[value.name] ++;
          });

        if (self.presenceCount[value.name] > lastIndex)
          lastIndex = self.presenceCount[value.name];
      });
    }

// =============================================== Инициализация =======================================================

    /**
     * Инициализация.
     *
     * @methodOf DataCenter.ServerEditCtrl
     * @param id - id оборудования
     * @param inv - инвентарный номер оборудования
     */
    self.init = function (id, inv) {
      GetDataFromServer.ajax('servers', id, inv)
        .then(
          function (data) {
            // Данные об оборудовании (состояние, тип, состав)
            self.data         = data.server || null;
            // Все существующие типы оборудования
            self.serverTypes  = data.server_types;
            // Все существующие типы запчастей с самими запчастями
            self.detailTypes  = data.detail_types;

            if (self.data && self.data.real_server_details)
              getDeatilsCount();
          },
          function (response, status) {
            Error.response(response, status);
          });
    };

// =============================================== Публичные функции ===================================================

    /**
     * Изменить тип оборудования.
     *
     * @methodOf DataCenter.ServerEditCtrl
     * @returns {boolean}
     */
    self.changeType = function () {
      if (!self.data.server_type) {
        self.data = null;
        return false;
      }

      $http.get('/server_types/' + self.data.server_type.name + '/edit.json')
        .success(function(data, status, header, config) {
          // Запчасти выбранного типа оборудования (в БД template_server_details)
          self.data.real_server_details = data.template_server_details;

          // Внутри self.data.real_server_details массивы сгруппированны по типам комплектующих (диски, памят и т.д.)
          $.each(self.data.real_server_details, function (key, arr) {
            $.each(arr, function() {
              // Сбросить id для всех комплектующих шаблонного оборудования.
              // Это необходимо, так как изначально мы получаем данные от состава шаблонного оборудования.
              // Далее эти данные запишутся в состав реального оборудования (в другую таблица) и получат новый id.
              this.id = null;

              // Определение индекса последнего элемента. Необходимо, чтобы при добавлении элементов знать, какой индекс
              // им выставлять.
              if (this.index > lastIndex)
                lastIndex = this.index;
            });
          });

          getDeatilsCount();
        })
        .error(function (response, status) {
          Error.response(response, status);
        });
    };

    /**
     * Добавить комплектующую.
     *
     * @methodOf DataCenter.ServerEditCtrl
     * @param index - индекс типа детали в массиве detailTypes.
     * @returns {boolean}
     */
    self.addDetail = function (index) {
      var type = self.detailTypes[index];

      // Выйти, если тип детали не найден.
      if (!type || type.server_parts.length == 0)
        return false;

      lastIndex ++;
      self.presenceCount[type.name] ++;

      // Если массива с данным видом комплектующих не существует, то необходимо его создать
      if (!self.data.real_server_details[type.name])
        self.data.real_server_details[type.name] = [];

      self.data.real_server_details[type.name].push({
          server_part_id: type.server_parts[0],
          server_type_id: self.data.server_type.id,
          server_part:    type.server_parts[0],
          id:             null,
          count:          1,
          destroy:        0,
          index:          lastIndex
      });
    };

    /**
     * Удалить комплектующую.
     *
     * @methodOf DataCenter.ServerEditCtrl
     * @param typeName - имя комплектующей
     * @param detail - объект-деталь
     */
    self.delDetail = function (typeName, detail) {
      if (detail.id)
        detail.destroy = 1;
      else {
        self.data.real_server_details[typeName].splice($.inArray(detail, self.data.real_server_details[typeName]), 1);
        if (detail.index == lastIndex)
          lastIndex -= 1;
      }

      self.presenceCount[typeName] --;
    };
  }
})();