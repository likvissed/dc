(function () {
  'use strict';

  app
    .controller('ServerIndexCtrl', ServerIndexCtrl)         // Общая таблица оборудования
    .controller('ServerTotalInfoCtrl', ServerTotalInfoCtrl) // Общая информация об оборудовании
    .controller('ServerPreviewCtrl', ServerPreviewCtrl)     // Предпросмотр оборудования
    .controller('ServerEditCtrl', ServerEditCtrl);          // Форма добавления/редактирования оборудования

  ServerIndexCtrl.$inject   = ['$controller', '$scope', '$rootScope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error', 'Ability'];
  ServerPreviewCtrl.$inject = ['$scope'];
  ServerEditCtrl.$inject    = ['$http', 'GetDataFromServer', 'Error'];

// =====================================================================================================================

  function ServerIndexCtrl($controller, $scope, $rootScope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.statusOptions = [ // Массив фильтра по статусу оборудования
      {
        value:  'all',
        string: 'Все статусы'
      },
      {
        value:  'atWork',
        string: 'В работе'
      },
      {
        value:  'test',
        string: 'Тестовые'
      },
      {
        value:  'inactive',
        string: 'В простое'
      }
    ];
    self.typeOptions    = [ // Массив фильтра по типу оборудования (данные берутся с сервера)
      {
        id:   0,
        name: 'Все типы'
      }
    ];
    self.selectedStatusOption = self.statusOptions[0];
    self.selectedTypeOption   = self.typeOptions[0];
    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withDataProp('data')
      .withOption('ajax', {
        url:  '/servers.json',
        data: {
          serverTypes:  true,
          statusFilter: self.selectedStatusOption.value
        },
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-2"' +
            '<"#servers.new-record">>' +
          '<"col-sm-3 col-md-3 col-lg-3">' +
          '<"col-sm-3 col-md-3 col-lg-3"' +
            '<"server-type-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"' +
            '<"server-status-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-6"i>' +
          '<"col-md-6"p>>'
      );
    self.servers    = {}; // Объекты оборудования (id => data)
    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Оборудование'),
      DTColumnBuilder.newColumn('server_type.name').withTitle('Тип').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('status').withTitle('Статус').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('location').withTitle('Расположение').withOption('className', 'col-sm-1'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-sm-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Сразу же включить режим предпросмотра ===============================

    var params = $location.absUrl().match(/servers\?id=(\d+)/);
    if (params)
      showServerData(params[1]);

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.servers[data.id] = data;
      return meta.row + 1;
    }

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
        self.selectedTypeOption = self.typeOptions[0];
      }
    }

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

    // Показать данные оборудования
    function showServerData(id) {
      Server.Server.get({ id: id },
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('serverData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    // Отрендерить ссылку на удаление оборудования
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPage.destroyServer(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

    // Выполнить запрос на сервер с учетом выбранных фильтров
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/servers.json',
        data: {
          statusFilter: self.selectedStatusOption.value,
          typeFilter:   self.selectedTypeOption.id
        }
      });
    }

    $rootScope.$on('deletedServerType', function (event, data) {
      // Удалить тип оборудования из фильтра таблицы оборудования
      var obj = $.grep(self.typeOptions, function (elem) { return elem.id == data });
      self.typeOptions.splice($.inArray(obj[0], self.typeOptions), 1);
    });

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      newQuery();
    };

    // Удалить оборудование
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

  function ServerPreviewCtrl($scope) {
    var self = this;

    $scope.$on('serverData', function (event, data) {
      self.name           = data.name;
      self.status         = data.status;
      self.location       = data.location;
      if (data.server_type)
        self.type         = data.server_type.name;
      if (data.clusters[0])
        self.cluster      = data.clusters[0].name;
      self.inventory_num  = data.inventory_num;
      self.serial_num     = data.serial_num;

      self.details = [];
      $.each(data.real_server_details, function (index, value) {
        self.details.push({
          name:   value.server_part.name,
          type:   value.server_part.detail_type.name,
          count:  value.count
        });
      });
    });
  }

// =====================================================================================================================

  function ServerEditCtrl($http, GetDataFromServer, Error) {
    var self = this;

    self.presenceCount  = {}; // Объект вида { Имя => Кол-во комплектующих }
    var lastIndex       = 0;  // Индекс последнего элемента формы. Используется для того, чтобы знать, какой индекс
                              // указывать для следующего элемента.

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

    self.init = function (id, name) {
      GetDataFromServer.ajax('servers', id, name)
        .then(function (data) {
          self.data         = data.server || null;  // Данные об оборудовании (состояние, тип, состав)
          self.serverTypes  = data.server_types;    // Все существующие типы оборудования
          self.detailTypes  = data.detail_types;    // Все существующие типы запчастей с самими запчастями

          if (self.data && self.data.real_server_details)
            getDeatilsCount();
        });
    };

// =============================================== Публичные функции ===================================================

    // Изменить тип оборудования
    self.changeType = function () {
      if (!self.data.server_type) {
        self.data = null;
        return false;
      }

      $http.get('/server_types/' + self.data.server_type.name + '/edit.json')
        .success(function(data, status, header, config) {
          self.data.real_server_details = data.template_server_details;  // Запчасти выбранного типа оборудования (в БД template_server_details)

          // Внутри self.data.real_server_details массивы сгруппированны по типам комплектующих (диски, памят и т.д.)
          $.each(self.data.real_server_details, function (key, arr) {
            $.each(arr, function() {
              // Сбросить id для всех комплектующих шаблонного оборудования
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

    // Добавить комплектующую
    // index - индекс типа детали в массиве detailTypes
    self.addDetail = function (index) {
      var type = self.detailTypes[index];

      // Выйти, если тип детали не найден.
      if (!type)
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

    // Удалить комплектующую
    // typeName - имя комплектующей
    // detail - объект-деталь
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