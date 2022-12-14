(function () {
  'use strict';

  app
    .controller('ServiceIndexCtrl', ServiceIndexCtrl)             // Общая таблица сервисов
    .controller('ServicePreviewCtrl', ServicePreviewCtrl)         // Предпросмотр сервиса
    .controller('ServiceEditCtrl', ServiceEditCtrl)               // Форма добавления/редактирования сервиса
    .controller('ServiceEditNetworkCtrl', ServiceEditNetworkCtrl) // Работа с подключениями к сети
    .controller('ServiceEditPortCtrl', ServiceEditPortCtrl)       // Работа с открытыми портами
    .controller('DependenceCtrl', DependenceCtrl)                 // Устанавливает зависимости сервиса
    .controller('ServiceSelectedCtrl', ServiceSelectedCtrl);      // Выбор формуляра для копирования конкретных аттрибутов при создании нового сервиса/сервера

  ServiceIndexCtrl.$inject        = ['$controller', '$scope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Cookies', 'ServiceShareFunc', 'Error', 'Ability'];
  ServicePreviewCtrl.$inject      = ['$scope', '$rootScope', 'Server', 'Ability', 'Error'];
  ServiceEditCtrl.$inject         = ['$scope', 'Service', 'GetDataFromServer', 'Error'];
  ServiceEditNetworkCtrl.$inject  = ['$scope', 'Service'];
  ServiceEditPortCtrl.$inject     = ['$scope', 'Service'];
  DependenceCtrl.$inject          = ['Service'];
  ServiceSelectedCtrl.$inject     = ['$scope'];

// =====================================================================================================================

  /**
   * Управление общей таблицей сервисов.
   *
   * @class DataCenter.ServiceIndexCtrl
   * @param $controller
   * @param $scope
   * @param $location
   * @param $compile
   * @param DTOptionsBuilder
   * @param DTColumnBuilder
   * @param Server - описание: {@link DataCenter.Server}
   * @param Flash - описание: {@link DataCenter.Flash}
   * @param Cookies - описание: {@link DataCenter.Cookies}
   * @param ServiceShareFunc - описание: {@link DataCenter.ServiceShareFunc}
   * @param Error - описание: {@link DataCenter.Error}
   * @param Ability - описание: {@link DataCenter.Ability}
   */
  function ServiceIndexCtrl($controller, $scope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Cookies, ServiceShareFunc, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});
    // Инициализация cookies.
    Cookies.Service.init();

    // Массив фильтров таблицы сервисов
    self.options = [
      {
        value:  'all',
        string: 'Все сервисы'
      },
      {
        value:  'crit',
        string: 'Критические задачи'
      },
      {
        value:  '712',
        string: 'Сервисы отдела 712'
      },
      {
        value:  '713',
        string: 'Сервисы отдела 713'
      },
      {
        value:  '***REMOVED***',
        string: 'Сервисы отдела ***REMOVED***'
      },
      {
        value:  '***REMOVED***',
        string: 'Сервисы отдела ***REMOVED***'
      },
      {
        value:  '200',
        string: 'Отделение 200'
      },
      {
        value:  'notUivt',
        string: 'Сервисы других подразделений (не ***REMOVED***)'
      },
      {
        value:  'virt***REMOVED***',
        string: 'Системы производств. виртуализации о.***REMOVED***'
      },
      {
        value:  'virt***REMOVED***',
        string: 'Системы виртуализации о.***REMOVED***'
      },
      {
        value:  'virtNetLan',
        string: 'Система виртуализации ЛВС сетевой службы'
      },
      {
        value:  'virtNetDMZ',
        string: 'Система виртуализации ДМЗ сетевой службы'
      },
      {
        value:  'onlyFormularTypeTrue',
        string: 'Только сервисы'
      },
      {
        value:  'onlyFormularTypeFalse',
        string: 'Только серверы'
      }
    ];
    // Выбранный элемент фильтра таблицы сервисов
    self.selectedOption = !Cookies.Service.get('mainServiceFilter') ? self.options[0].value : Cookies.Service.get('mainServiceFilter');
    // Флаг, скрывающий сервисы, которые не введены в эксплуатацию
    self.exploitation   = Cookies.Service.get('showOnlyExploitationServices');
    // Объекты сервисов (id => data)
    self.all_name_services = {};
    self.services       = {};
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withOption('stateSave', true)
      .withOption('ajax', {
        url:  '/services.json',
        data: {
          filter:       self.selectedOption,
          exploitation: self.exploitation
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
            '<"add-new-service">>' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"add-service-based">>' +
          '<"col-sm-1 col-md-1 col-lg-3">' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"service-exploitation">>' +
          '<"col-sm-3 col-md-3 col-lg-2"' +
            '<"service-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-6"i>' +
          '<"col-md-6"p>>'
      );
    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('flags').withTitle('Флаг').withOption('className', 'text-center').notSortable().renderWith(priority),
      DTColumnBuilder.newColumn('formular_type').withTitle('Тип').withOption('className', 'text-center').notSortable().renderWith(type_formular),
      DTColumnBuilder.newColumn('number').withTitle('Номер').withOption('className', 'col-md-1'),
      DTColumnBuilder.newColumn('name').withTitle('Имя').withOption('className', 'col-md-4'),
      DTColumnBuilder.newColumn('time_work').withTitle('Режим').withOption('className', 'col-md-1 text-center'),
      DTColumnBuilder.newColumn('dept').withTitle('Отдел').withOption('className', 'col-md-1 text-center'),
      DTColumnBuilder.newColumn('contacts').withTitle('Ответственные').withOption('className', 'col-md-2'),
      DTColumnBuilder.newColumn('scan').withTitle('Формуляр').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('act').withTitle('Акт').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('instr_rec').withTitle('Инстр. восст.').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn('instr_off').withTitle('Инстр. выкл.').withOption('className', 'text-center').notSortable(),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center').renderWith(delRecord),
      DTColumnBuilder.newColumn('name_monitoring').withClass('hiddencolumn')
    ];

    var reloadPaging = false;

// =============================================== Сразу же включить режим предпросмотра ===============================

    var reg     = new RegExp('(services|' + $location.host() + ')/?\\?id=(\\d+)');
    var params  = $location.absUrl().match(reg);

    if (params)
      showServiceData(params[2]);

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
      // Сохранить данные сервиса (нужны для вывода пользователю информации об удаляемом элементе)
      self.services[data.id] = data;

      // все назвния и id сервисов для выбора "Создать на основе" в модальном окне
      self.all_name_services = data.all_name_services;

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

            // Показать инструкции и иконки урпавления только для определенных ролей
            api.column(9).visible(Ability.canView('instr'));
            api.column(10).visible(Ability.canView('instr'));
            api.column(11).visible(Ability.canView('admin_tools'));
          },
            function (response, status) {
              Error.response(response, status);

              // Удалить все данные в случае ошибки проверки прав доступа
              api.rows().remove().draw();
            });
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
      // Создание события просмотра данных о формуляре
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServiceData(data.id));
      });

      // Компиляция строки
      $compile(angular.element(row))($scope);
    }

    /**
     * Показать данные сервиса.
     *
     * @param id
     * @private
     */
    function showServiceData(id) {
      Server.Service.get({ id: id },
        // Success
        function (response) {
          var data = {
            // Объект-ответ с сервера
            response:     response,
            // Флаг, определяющий, было ли вызвано событие "service:show" из кластера (false - не из кластера)
            fromCluster:  false
          };

          // Отправить данные контроллеру ServicePreviewCtrl
          $scope.$broadcast('service:show', data);
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    /**
     * Отрендерить ссылку на удаление сервиса.
     *
     * @param data
     * @param type
     * @param full
     * @param meta
     * @returns {string}
     * @private
     */
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="servicePage.destroyService(' + data.id +
        ')" tooltip-placement="top" uib-tooltip="Удалить сервис"><i class="far fa-trash-alt"></a>';
    }

    /**
     * Выполнить запрос на сервер с учетом выбранных фильтров.
     *
     * @private
     */
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/services.json',
        data: {
          filter:       self.selectedOption,
          exploitation: self.exploitation
        },
        error: function (response) {
          Error.response(response);
        }
      });
    }

    /**
     * Установить флаг приоритета функционирования для сервиса.
     *
     * @param flag - приоритет функционирования
     * @returns {*}
     * @private
     */
    function priority(flag) {
      return ServiceShareFunc.priority(flag);
    }

    /**
     * Установить иконку типа формуляра (true - сервис / false - сервер (ВМ))
     *
     * @param type - тип формуляра
     * @returns {*}
     * @private
     */
    function type_formular(type) {
      return ServiceShareFunc.type_f(type);
    }

// =============================================== Публичные функции ===================================================

    /**
     * Выполнить запрос на сервер после изменения фильтра.
     *
     * @methodOf DataCenter.ServiceIndexCtrl
     */
    self.changeFilter = function () {
      Cookies.Service.set('mainServiceFilter', self.selectedOption);

      newQuery();
    };

    /**
     * Выполнить запрос на сервер после изменения фильтра показать/скрыть сервисы, которые не введены в эксплуатацию.
     *
     * @methodOf DataCenter.ServiceIndexCtrl
     */
    self.showProjects = function () {
      self.exploitation = self.exploitation == 'true' ? 'false' : 'true';
      Cookies.Service.set('showOnlyExploitationServices', self.exploitation);

      newQuery();
    };

    /**
     * Кнопка "Создать на основе". Открытие модального окна для выбора сервиса
     *
     * @methodOf DataCenter.ServiceIndexCtrl
     */
    self.addService = function (type) {
      // Тип формуляра и массив сервисов (id и name)
      let obj = {
        type: type,
        services: self.all_name_services
      };

      // Передача параметров в ServiceSelectedCtrl
      $scope.$broadcast('service:selected:show', obj);
      // Открытие модального окна для выбора сервиса для копирования определенных атрибутов
      self.selectModal = true;
    };

    /**
     * Удалить сервис
     *
     * @methodOf DataCenter.ServiceIndexCtrl
     * @param num - id сервиса
     * @returns {boolean}
     */
    self.destroyService = function (num) {
      var confirm_str = "Вы действительно хотите удалить формуляр \"" + self.services[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Service.delete({ id: num },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);
        },
        // Error
        function (response) {
          Error.response(response);
        });
    };
  }

// =====================================================================================================================

  /**
   * Управление предпросмотром сервиса
   *
   * @class DataCenter.ServicePreviewCtrl
   * @param $scope
   * @param $rootScope
   * @param Server - описание: {@link DataCenter.Server}
   * @param Ability - описание: {@link DataCenter.Ability}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function ServicePreviewCtrl($scope, $rootScope, Server, Ability, Error) {
    var self = this;

    // Флаг, скрывающий модальное окно
    self.previewModal           = false;
    // Модальное окно "Создать на основе"
    self.selectModal            = false;
    // Флаг, запрещающий просматривать информацию о сервере, т.к. предпросмотр формуляра и так открыт из режима
    // предпросмотра сервера
    self.disableClusterPreview  = false;

// ================================================ Инициализация ======================================================

    // "Слушатель" события service:show
    $scope.$on('service:show', function (event, json) {
      // Показать модальное окно
      self.previewModal = true;
      // Определяет, есть ли права на показ инструкций
      self.showInstr    = Ability.canView('instr');

      // Флаг. Если режим просмотра сервиса открывается из режима просмотра сервера - true
      self.disableClusterPreview = json.fromCluster;

      // Данные, полученные с сервера
      var data = json.response;

      // Данные сервиса
      self.service      = angular.copy(data.service);
      // Дедлайн для тестового сервиса
      self.deadline     = angular.copy(data.deadline);
      // Флаги, определяющие, имеются ли загруженные файлы
      self.missing_file = angular.copy(data.missing_file);
      // Ответственные
      self.contacts     = angular.copy(data.contacts);
      // Список открытых портов
      self.ports        = angular.copy(data.ports);
      // Массив подключений к сети
      self.networks     = [];
      // Массив подключений к СХД
      self.storages     = [];
      // Установка флага взависимости от того, введен ли сервис в эксплуатацию и приоритета функционирования
      self.flag         = {
        icon: '',
        text: ''
      };
      // Хостинг сервиса
      self.hosting      = angular.copy(data.hosting[0]);
      // Массив сервисов-родителей
      self.parents      = angular.copy(data.parents);
      // Массив сервисов-потомок
      self.childs      = angular.copy(data.childs);

      // Всплывающее сообщение иконки хостинга
      self.tooltip = self.hosting ? 'Просмотреть информацию о сервере' : 'Хостинг сервиса отсутствует';

      // Если сервис введен в эксплуатацию
      if (self.service.exploitation) {
        self.flag.icon = 'fa-toggle-on text-success';
        self.flag.text = 'Сервис введен в эксплуатацию';
      }
      else {
        self.flag.icon = 'fa-toggle-off text-muted';
        self.flag.text = 'Сервис не введен в эксплуатацию';
      }

      // Заполнение массива networks
      $.each(data.networks, function (index, value) {
        self.networks[index] = {
          name:   '',
          value:  ''
        };

        if (index == 0)
          self.networks[index].name   = 'Подключения к сети';

        self.networks[index].value  = value;
      });

      // Заполнение массива storages
      $.each(data.storages, function (index, value) {
        self.storages[index] = {
          name:   '',
          value:  ''
        };

        if (index == 0)
          self.storages[index].name = 'Подключение к СХД';

        self.storages[index].value = value;
      });

      // Максимальное время восстановления
      self.service.max_time_rec = self.getStringTime(self.service.max_time_rec);
      // Время восстановления данных
      self.service.time_recovery = self.getStringTime(self.service.time_recovery);
      // Время восстановления после отказа
      self.service.time_after_failure = self.getStringTime(self.service.time_after_failure);
      // Время возобновления после катастрофы
      self.service.time_after_disaster = self.getStringTime(self.service.time_after_disaster);
    });

// =============================================== Публичные функции ===================================================

    /**
     * Преобразовать минуты в строку "часы - минуты"
     */
    self.getStringTime = function (value) {
      if (!value) { value = 0 }

      let hours, minutes;
      hours = parseInt(value)/60;

      if (Number.isInteger(hours)) {
        minutes = 0;
      } else {
        hours = parseInt(hours);
        minutes = parseInt(value) - (hours*60);
      }

      if (hours == 0) {
        return `${minutes} мин.`;
      } else {
        return `${hours} ч. ${minutes} мин.`;
      }
    };

    /**
     * Показать информацию о сервере
     *
     * @methodOf DataCenter.ServicePreviewCtrl
     * @returns {boolean}
     */
    self.showCluster = function () {
      if (!self.hosting || self.disableClusterPreview)
        return false;

      Server.Cluster.get({ id: self.hosting.id },
        // Success
        function (response) {
          var data = {
            // Объект-ответ с сервера
            response:     response,
            // Флаг, определяющий, было ли вызвано событие "service:show" из сервиса (false - не из сервиса)
            fromService:  self.service.name
          };

          // Отправить данные контроллеру ServerPartPreviewCtrl
          $rootScope.$broadcast('cluster:show', data);
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    };
  }

// =====================================================================================================================

  /**
   * Форма добавления/редактирования сервиса
   *
   * @class DataCenter.ServiceEditCtrl
   * @param $scope
   * @param Service - описание: {@link DataCenter.Service}
   * @param GetDataFromServer - описание: {@link DataCenter.GetDataFromServer}
   * @param Error - описание: {@link DataCenter.Error}
   */
  function ServiceEditCtrl($scope, Service, GetDataFromServer, Error) {
    var self = this;

// ================================================ Инициализация ======================================================

    // Флаг для директивы modalShow
    self.flags = Service.getFlags();

    /**
     * Инициализация начальных данных
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param id - id формуляра
     * @param name - имя формуляра
     */
    self.init = function (id, name) {
      GetDataFromServer.ajax('services', id, name)
        .then(
          function (data) {
            Service.init(id, name, data);
            // Объект вида { selected: Выбранный объект в поле select "Приоритет функционирования", values: Массив
            // всех видов приоритетов }.
            self.priority     = Service.getPriorities();
            // Объект вида { selected: Выбранный объект в модальном окне Порты, values: Массив всех подключений к
            // сети }.
            self.network      = Service.getNetworks();
            // Объект вида { local: Имя + Список портов, доступных в ЛС, inet: Имя +ы Список портов, доступных из
            // Интернет }.
            self.ports        = Service.getPorts();
            // Массив, показывающий отсутствующие файлы.
            self.missing_file = Service.getMissingFiles();
            // Массив с флагами наличия инструкций по восст./откл, а так же подготовленных для загрузки файлов.
            self.file_flags   = Service.getFileFlags();
            // Общий статус наличия файлов, который определяется из статусов missing_file и file_flags. Необходим.
            // для того, чтобы знать, в какой цвет подкрашивать dropdown меню шапки.
            self.total_file_status  = Service.getTotalFileStatus();
            // Объект с флагами, скрывающих/показывающих надписи "Отсутствует"/"Присутствует" в dropdown меню шапки.
            self.file_checkbox      = {
              instr_rec: false,
              instr_off: false
            };
            // Массив с сервисами-родителями.
            // self.parents      = Service.getParents();
            // Массив с сервисами-потомками
            self.childs       = Service.getChilds();
            // Массив с подключениями к СХД.
            self.storages     = Service.getStorages();
            // Необходим для исключения этого имени из списка родителей-сервисов.
            self.current_name = name ? name : null;
            // Массив всех существующих сервисов для выбора сервисов-родителей.
            self.services     = Service.getServices();

            // Все значения сервиса !!!
            self.values_service = Service.getValueService();
                      
            // Массив всех тегов из таблицы Tag
            self.list_tags = Service.getListTags();
            // Все теги, которые есть или будут добавлены, связанные с формуляром
            self.service_tag = Service.getServiceTags();
            // Массив тего, удаленных для текущего формуляра
            self.delete_service_tag = [];

            // Объект значений <max_time_rec, time_recovery, time_after_failure, time_after_disaster> в часах и минутах
            self.values_time = Service.getValueTime();

            // Максимальное время восстановления
            self.max_time_rec_hours = self.values_time.max_time_rec.hours || 0;
            self.max_time_rec_minutes = self.values_time.max_time_rec.minutes || 0;

            // Время восстановления данных
            self.time_recovery_hours = self.values_time.time_recovery.hours || 0;
            self.time_recovery_minutes = self.values_time.time_recovery.minutes || 0;

            // Время восстановления после отказа
            self.time_after_failure_hours = self.values_time.time_after_failure.hours || 0;
            self.time_after_failure_minutes = self.values_time.time_after_failure.minutes || 0;

            // Время возобновления после катастрофы
            self.time_after_disaster_hours = self.values_time.time_after_disaster.hours || 0;
            self.time_after_disaster_minutes = self.values_time.time_after_disaster.minutes || 0;

            self.lists_name_service_for_vm = Service.getListsNameServiceForVM();
            self.setMinutes();
          },
          function (response, data) {
            Error.response(response, data);
          }
        )
        .then(function () {
          /**
           * Фильтр, определяющий, показывать ли надпись "Отсутствует" в поле родителей-сервисов
           *
           * @methodOf DataCenter.ServiceEditCtrl
           * @returns {boolean}
           */
          self.showChilds = function () {
            return Service.showChilds();
          };
        });
    };

// ================================================ "Срок тестирования" ================================================

    // Объект, содержащий данные для библиотеки DatePicker
    self.deadline = {
      // Переменная определяющая начальное состояние календаря (false - скрыть, true - показать)
      openDatePicker: false,
      // Формат времени, который видит пользователь
      format:         'dd-MMMM-yyyy'
    };

    /**
     * Показать календарь.
     *
     * @methodOf DataCenter.ServiceEditCtrl
     */
    self.openDatePicker = function() {
      self.deadline.openDatePicker = true;
    };

    // Дополнительные параметры
    self.dateOptions = {
      //formatDayTitle: 'MMM yyyy',
      minDate:    new Date(),
      showWeeks:  false,
      locale:     'ru'
    };

// ========================================= "Перевод из часы - минуты в = Минуты" =======================================

    self.setMinutes = function () { 
      if (Number(self.max_time_rec_minutes) > 59) {
        self.max_time_rec_minutes = 59;
      }
      if (Number(self.time_recovery_minutes) > 59) {
        self.time_recovery_minutes = 59;
      }
      if (Number(self.time_after_failure_minutes) > 59) {
        self.time_after_failure_minutes = 59;
      }
      if (Number(self.time_after_disaster_minutes) > 59) {
        self.time_after_disaster_minutes = 59;
      }

      self.max_time_rec = Number(self.max_time_rec_hours*60) + Number(self.max_time_rec_minutes);     
      self.time_recovery = Number(self.time_recovery_hours*60) + Number(self.time_recovery_minutes);     
      self.time_after_failure = Number(self.time_after_failure_hours*60) + Number(self.time_after_failure_minutes);     
      self.time_after_disaster = Number(self.time_after_disaster_hours*60) + Number(self.time_after_disaster_minutes);     
    };

// ================================================ "Подключения к сети" ===============================================

    /**
     * Открыть модальное окно "Подключение к сети"
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param $index
     */
    self.showNetworkModal = function ($index) {
      var obj = {
        index:    $index, // Запоминаем индекс строки, данные о которой необходимо изменить
        network:  Service.getNetworkTemplate($index)
      };

      $scope.$broadcast('service:network:show', obj);
    };

    /**
     * Добавить строку "Подключения к сети"
     *
     * @methodOf DataCenter.ServiceEditCtrl
     */
    self.addNetwork = function () {
      Service.addNetwork();
    };

    /**
     * Удалить строку "Подключения к сети"
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param network - удаляемый объект
     */
    self.delNetwork = function (network) {
      Service.delNetwork(network);
    };

    /**
     * Удалить id выбранного тега из delete_service_tag
     *
     * @methodOf DataCenter.ServiceEditCtrl
     */
    self.selectedTag = function (tag) {
      self.delete_service_tag.forEach(function(tt, index){
        if (tt.name == tag.name) {
          self.delete_service_tag.splice(index, 1);
        }
      });
    };

    /**
     * При удалении тега из массива service_tag
     * добавить его id в массив delete_service_tag
     *
     * @methodOf DataCenter.ServiceEditCtrl
     */
    self.deleteTag = function (tag) {
      self.delete_service_tag.push(tag.id);
    };

    /**
     * Добавляет в input_tag
     * существующий или новый тег (новый объект)
     *
     * @methodOf DataCenter.ServiceEditCtrl
     */
    self.manuallyTag = function (new_tag) {
      let new_obj = {
        id: '',
        name: new_tag.toLowerCase()
      }
      return new_obj;
    };


// ================================================ "Открытые порты" ===================================================

    /**
     * Открыть модальное окно "Открытые порты"
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param $event
     */
    self.showPortsModal = function ($event) {
      var obj = {
        network:  self.network,
        event:    $event,
        ports:    Service.getCurrentPorts()
      };

      $scope.$broadcast('service:ports:show', obj);
    };

// ================================================ Работа с файлами ===================================================

    /**
     * Изменить указанный ключ объекта missing_file после выбора (не загрузки) файла на значение false.
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param type - ключ массива missing_file (тип файла)
     */
    self.changeFileStatus = function (type) {
      Service.changeFileFlagStatus(type);
    };


    /**
     * Обработчик события после выбора файла соответствующего типа для загрузки на сервер.
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param type - ключ массива missing_file (тип файла)
     */
    self.prepareLoadFile = function (type) {
      Service.changeFileFlagStatus(type, true); // Изменить цвет dropdown меню

      self.file_checkbox[type] = true; // Спрятать записи "Отсутствует"/"Присутствует"
    };

    /**
     * Удалить файл
     *
     * @methodOf DataCenter.ServiceEditCtrl
     * @param $event
     */
    self.removeFile = function ($event) {
      if (!self.missing_file[$event.target.attributes['data-type'].value])
        Service.removeFile($event);
    };
  }

// =====================================================================================================================

  /**
   * Работа с подключениями к сети
   *
   * @class DataCenter.ServiceEditNetworkCtrl
   * @param $scope
   * @param Service - описание: {@link DataCenter.Service}
   */
  function ServiceEditNetworkCtrl($scope, Service) {
    var self = this;

    // Переменная, содержащая объект "подключение к сети" до внесения в него изменений
    var standart = null;
    $scope.$on('service:network:show', function (event, data) {
      // Индекс в массиве
      self.index  = data.index;
      // Объект, содержащий значения полей
      self.value  = angular.copy(data.network);
      // Данные на момент открытия модального окна
      standart    = angular.copy(self.value);

      Service.setFlag('networkModal', true);
    });

    /**
     * Закрыть модальное окно по нажатии "Отмена"
     *
     * @methodOf DataCenter.ServiceEditNetworkCtrl
     */
    self.closeNetworkModal = function () {
      Service.setFlag('networkModal', false);

      // Проверка, были ли изначально данные пустые. Если да, значит объект network был создан непосредственно
      // перед открытием окна. Чтобы пустой объект не появился в поле select (модальное окно "Открытые порты"),
      // необходимо записать null в объект network
      if (standart.segment == '' && standart.vlan == '' && standart.dns_name == '')
        Service.setNetwork(self.index, null, 'cancel'); // Записали null
      else
        Service.setNetwork(self.index, standart); // Записали изначальные данные
    };

    /**
     * Закрыть модальное окно по нажатии "Готово"
     *
     * @methodOf DataCenter.ServiceEditNetworkCtrl
     */
    self.readyNetworkModal = function () {
      // Для новых данных
      if (standart.segment == '' && standart.vlan == '' && standart.dns_name == '')
        Service.setNetwork(self.index, self.value, 'new'); // Записали новые данные
      else
        Service.setNetwork(self.index, self.value); // Записали новые данные
    };
  }

// =====================================================================================================================

  /**
   * Работа с открытыми портами
   *
   * @class DataCenter.ServiceEditPortCtrl
   * @param $scope
   * @param Service
   */
  function ServiceEditPortCtrl($scope, Service) {
    var self = this;

    // Инициализация
    $scope.$on('service:ports:show', function (event, data) {
      if (data.ports.length != 0) {
        self.template_index = 0;
        self.template_value = angular.copy(data.ports);
        self.network        = data.network;

        Service.setFlag('portModal', true);
      }
      else {
        alert("Необходимо создать \"Подключение к сети\"");
      }
    });

    /**
     * Событие после выбора "Подключения к сети" в модальном окне "Открытые порты"
     *
     * @methodOf DataCenter.ServiceEditPortCtrl
     */
    self.changeNetwork = function () {
      // Получаем новый индекс массива портов (используется в паршиале _ports в качестве индекса массива template_ports)
      $.each(self.template_value, function (index, value) {
        if (value.local_id == self.network.selected.local_id) {
          self.template_index = index;

          return false;
        }
      });
    };

    /**
     * Закрыть модальное окно по кнопке "Готово"
     *
     * @methodOf DataCenter.ServiceEditPortCtrl
     */
    self.readyPortsModal = function () {
      Service.setFlag('portModal', false);

      //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
      Service.setPorts(self.template_value);
    };

    /**
     * Закрыть модальное окно по кнопке "Отмена"
     *
     * @methodOf DataCenter.ServiceEditPortCtrl
     */
    self.closePortsModal = function () {
      Service.setFlag('portModal', false);
    };

    /**
     * Фильтр для отображения подключений к сети в модальном окне "Открытые порты"
     *
     * @methodOf DataCenter.ServiceEditPortCtrl
     * @returns {Function}
     */
    self.networksFilter = function () {
      return function (network) {
        return network.value != null;
      }
    };
  }

// =====================================================================================================================

  /**
   * Управление зависимостями сервиса
   *
   * @class DataCenter.DependenceCtrl
   * @param Service
   */
  function DependenceCtrl(Service) {

    /**
     * Добавить сервис-родитель
     *
     * @methodOf DataCenter.DependenceCtrl
     */
    this.addChild = function () {
      Service.addChild();
    };

    /**
     * Удалить сервис-родитель
     *
     * @methodOf DataCenter.DependenceCtrl
     * @param child
     */
    this.delChild = function (child) {
      Service.delChild(child);
    };

    /**
     * Пересчитать значения полей
     *
     * @methodOf DataCenter.DependenceCtrl
     */
    this.calculateField = function () {
      Service.calculateField();
    };

  }

  // =====================================================================================================================

  /**
   * Работа с выбором сервиса для копирования некоторых атрибутов при создании нового сервиса/сервера
   *
   * @class DataCenter.ServiceSelectedCtrl
   */
  function ServiceSelectedCtrl($scope) {
    let self = this;

    $scope.$on('service:selected:show', function (event, data) {
      self.services = data.services;
      self.type = data.type;

      // Выбранный объект сервиса (id и name)
      // Изначально подставляется первый элемент из массива всех
      self.selected_service = self.services[0];
    });
  }
  

// =====================================================================================================================

})();
