(function() {
  'use strict';

  app
    .service('Service', Service)                    // Создание/редактирование сервиса
    .service('ServiceShareFunc', ServiceShareFunc); // Функции, которые вызываются не только на странице сервисов

  Service.$inject = ['$http', 'Flash'];

// =====================================================================================================================

  /**
   * Сервис для создания/редактирования формуляра. Содержит все данные о формуляре (например, данные связки списка
   * открытых портов с подключениями к сети, зависимости сервиса и т.д.).
   *
   * @class DataCenter.Service
   * @param $http
   * @param Flash
   */
  function Service($http, Flash) {
    var self = this;

    // Переменные, используемые только внутри фабрики
    // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2,так как в формуляре
    // минимум две строки на этот пункт)
    var visible_network_count = 2;
    // Количество строк "Подключения к СХД", видимых пользователем
    var visible_storage_count = 2;
    // Id текущего формуляра
    var current_id;
    // Имя текущего формуляра
    var current_name;
    // Массив объектов открытых портов для выбранного подключения к сети
    var template_ports        = [];
    // Объект, содержащий строки открытых портов, доступных из ЛС и сети Интернет
    var ports                 = {
        local:  '',
        inet:   ''
      };

    // Переменные, которые возвращаются контроллеру
    // Основные данные сервера
    var service = {
      // Данные, полученные с сервера
      old_data: null,
      // Приоритет функционирования сервиса
      priority: {
        // Используется в качестве модели для первого элемента в поле select "Приоритет функционирования"
        selected:   null,
        // Массив приоритетов функционирования
        values:     [],
        // Срок тестирования
        deadline:  new Date()
      },
      network: {
        // Используется в качестве модели для первого элемента в модальном окне "Открытые порты"
        selected: null,
        // Массив объектов подключений к сети
        values:   []
      },
      // Массив сервисов-родителей
      parents:  [],
      // Массив подключений к СХД
      storages: []
    };
    // Дополнительные данные, необходимые для работы страницы
    var additional = {
      // Объект, содержащий различные флаги для работы страницы создания/редактирования сервисов
      flags: {
        // Флаг, определяющий, скрывать модальное окно "Подключения к сети" или нет
        networkModal: false,
        // Флаг, определяющий, скрывать модальное окно "Открытые порты" или нет
        portModal:    false
      },
      // Объект, содержащий флаги, которые показывают отсутствующие файлы (влияет на строки "Удалить" и "Скачать")
      missing_file:       {},
      // Объект, содержащий флаги, которые показывают, был ли выбран файл для загрузки, либо была ли нажата кнопка
      // "присутствует"/"отсутствует" инструкция по восст./откл.
      file_flags:         {},
      // Общий статус наличия/отсутствия файлов (зависит от missing_file и file_flags). Необходим для того, чтобы
      // знать в какой увет подкрашивать dropdown меню в шапке режима создания/редактирования.
      total_file_status : {}
    };

// =============================================== Приватные методы ====================================================

    /**
     * Получить данные о сервисе.
     *
     * @param name - необязатнльный параметр. Имя ключа в объекте service.old_data.
     * @returns data | null
     * @private
     */
    function _getOldServiceData(name) {
      if (name)
        return service.old_data[name] ? service.old_data[name] : null;

      return service.old_data;
    }

// =============================================== Работа с подключениями к сети =======================================

    /**
     * Возвращает строку, которую видит пользователь в поле "Подключение к сети".
     *
     * @param data {object} - объект, содержащий сегмент, vlan и dns-имя подключения к сети
     * @returns {string}
     * @private
     */
    function _setNetworkString(data) {
      return [data.segment, data.vlan, data.dns_name].join(', ');
    }

    /**
     * Возвращает объект, содержащий изменяемые параметры пункта "Подключения к сети".
     *
     * @param index - номер строки подключения к сети (начиная с 0)
     * @returns {{name: string, is_first: boolean}}
     * @private
     */
    function _checkFirstNetwork(index) {
      var
        name  = '',
        first = false;

      if (index == 0) {
        name  = 'Подключение к сети';
        first = true;
      }

      return {name: name, is_first: first};
    }

    /**
     * Установить начальное значение для объекта "Подключение к сети".
     *
     * @param index - номер строки подключения к сети (начиная с 0)
     * @returns {{destroy: number, id: null, view: null, hide: boolean, value: null, ports: ({id, destroy, inet_tcp_ports, inet_udp_ports, local_id, local_tcp_ports, local_udp_ports}|*)}}
     * @private
     */
    function _defaultNetworkParams(index) {
      return {
        destroy:  0,
        id:       null,
        view:     null,
        hide:     false,
        value:    null,
        ports:    _defaultPorts(index)
      }
    }

    /**
     * Элемент массива подключений к сети.
     *
     * @param index - индекс, необходимый для связывания массива networks с массивом открытых портов (template_ports)
     * @param id -  id в базе данных
     * @param destroy - если 1 - удалить из базы
     * @param name - наименование в первом столбце для первой строки
     * @param first - для первого элемента (чтобы знать, писать ли наименование "Подключения к сети")
     * @param view - выводимая на экран строка
     * @param hide - если true - скрыть от пользователя (при нажатии кнопки "Удалить")
     * @param value - массив объектов, записываемых в базу (Сегмент, VLAN, DNS-имя)
     * @param ports - массив объектов с перечислением открытых портов
     * @returns {{local_id: *, id: *, destroy: *, name: *, first: *, view: *, hide: *, value: *, ports: *}}
     * @private
     */
    function _singleNetwork(index, id, destroy, name, first, view, hide, value, ports) {
      return {
        local_id: index,
        id:       id,
        destroy:  destroy,
        name:     name,
        first:    first,
        view:     view,
        hide:     hide,
        value:    value,
        ports:    ports
      }
    }

    /**
     * Функция, создающая массив подключений к сети.
     *
     * @param networks - объект, содержащий данные существующих подключений к сети
     * @private
     */
    function _generateNetworkArr(networks) {
      var
        obj,
        params;

      // Заполнение минимально необходимого количества строк подключений к сети
      for (var index = 0; index < visible_network_count; index++) {
        obj     = _checkFirstNetwork(index);
        params  = _defaultNetworkParams(index);
        service.network.values.push(_singleNetwork(index, params.id, params.destroy, obj.name, obj.is_first, params.view, params.hide, params.value, params.ports));
      }

      // Для существующих подключений к сети
      if (networks) {
        if (networks.length > 2)
          visible_network_count = networks.length;

        $.each(networks, function (index, value) {
          var
            obj   = _checkFirstNetwork(index),
            id    = value.id,
            view  = _setNetworkString(_singleNetworkTemplate(value.segment, value.vlan, value.dns_name)),
            ports;

          if (value.service_port) {
            ports = value.service_port;
            delete value.service_port;
          }
          else
            ports = _defaultPorts(index);

          // Удалить id из внутреннего массива
          delete value.id;

          ports.local_id = index;
          ports.destroy = 0;

          service.network.values[index] = _singleNetwork(index, id, params.destroy, obj.name, obj.is_first, view, params.hide, value, ports);
        });
      }
    }

    /**
     * Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты".
     * @private
     */
    function _setFirstNetworkElement() {
      $.each(service.network.values, function (index, network) {
        if (network.value != null && network.view != '') {
          service.network.selected = network;

          return false;
        }
      });
    }

    /**
     * Создает и возвращает элемента массива подключений к сети.
     *
     * @param segment
     * @param vlan
     * @param dns_name
     * @returns {{segment: *, vlan: *, dns_name: *}}
     * @private
     */
    function _singleNetworkTemplate(segment, vlan, dns_name) {
      return {
        segment:  segment,
        vlan:     vlan,
        dns_name: dns_name
      }
    }

    /**
     * Проверка корректности данных подключений к сети.
     *
     * @param data
     * @returns {boolean}
     * @private
     */
    function _checkTemplateNetworkPassed(data) {
      return data != null && (data.segment != '' && data.vlan != '' && data.dns_name != '');
    }

// =============================================== Работа с открытыми портами ==========================================

    /**
     * Создает и возвращает начальное значение открытых портов.
     *
     * @param index
     * @returns {{id: null, destroy: number, inet_tcp_ports: string, inet_udp_ports: string, local_id: *, local_tcp_ports: string, local_udp_ports: string}}
     * @private
     */
    function _defaultPorts(index) {
      return {
        id:               null,
        destroy:          0,
        inet_tcp_ports:   '',
        inet_udp_ports:   '',
        local_id:         index,
        local_tcp_ports:  '',
        local_udp_ports:  ''
      }
    }

    /**
     * Проверка корректности данных открытых портов.
     *
     * @param data - объект, содержащий список открытых портов
     * @returns {boolean}
     * @private
     */
    function _checkTemplatePortPassed(data) {
      return data.local_tcp_ports != '' || data.local_udp_ports != '' || data.inet_tcp_ports != '' || data.inet_udp_ports != '';
    }

    /**
     * Обработать входные данные открытых портов фильтром регулярных выражений (для корректного отображения данных).
     *
     * @param data - объект, содержащий такую же структуру, как и возвращаемый объект функции {@link _defaultPorts}
     * @returns {*}
     * @private
     */
    function _filterPorts(data) {
      var arr = {
        local_tcp_ports:  data.local_tcp_ports,
        local_udp_ports:  data.local_udp_ports,
        inet_tcp_ports:   data.inet_tcp_ports,
        inet_udp_ports:   data.inet_udp_ports
      };

      $.each(arr, function (key, value) {
        data[key] = value.toString()
          .replace(/[^\d ,-]/g, '')               // Разрешаем только цифры, пробел, тире и запятую
          .replace(/-+/g, '-')                    // Множественное повторение тире (оставить одно)
          .replace(/,+/g, ',')                    // Множественное повторение запятой (оставить одну)
          .replace(/ +/g, ' ')                    // Множественное повторение пробелов (оставить один)
          .replace(/, {0,1}- {0,1},/g, ',')       // Только тире (удалить, если без цифр)
          .replace(/(\d+)[- ]*,/g, '$1,')         // Тире или пробелы после цифры и до запятой (удалить)
          .replace(/(,[- ]*)+(\d+)/g, ', $2')     // Тире или пробелы до цифры и после запятой (удалить)
          .replace(/(\d+) ([^-])/g, '$1, $2')     // Поставить запятую, если она отсутствует
          .replace(/(\d+) {0,1}-[ -]*/g, '$1 - ') // Удалить лишний пробел и тире (например: 60 - - - 80)
          .replace(/(\d+)-(\d+)/g, '$1 - $2')     // Добавить пробелы при конструкции 60-80
          .replace(/(\d+)( - \d+)+/g, '$1$2')     // Заменить конструкцию вида 1 - 2 - 3 - 4 на 1 - 4
          .replace(/^[ ,-]+/g, '')                // Начало строки
          .replace(/[ ,-]+$/g, '');               // Конец строки;
      });

      return data;
    }

    /**
     * Установть tcp/udp суффикс к указанным портам и вернуть измененный объект.
     *
     * @param data - строка, содержащая список портов и прошедшая фильтрацию через функцию {@link _filterPorts}
     * @param suffix - строка, содержщая суффикс(tcp, udp), который необходимо добавить к портам, указанным в data
     * @returns {*}
     * @private
     */
    function _setPortSuffix(data, suffix) {
      data = data.replace(/(\d+ {0,1}- {0,1}\d+)[, ]*/g, '$1/' + suffix + ', ')
        .replace(/(\d+)([^\/ *\-\d+] *)/g, '$1/' + suffix + ', ')
        .replace(/(\d+),{0,1} {0,1}$/g, '$1/' + suffix);

      if (suffix == 'tcp')
        return data.replace(/(\d+\/tcp),{0,1} {0,1}$/g, '$1');
      else
        return data.replace(/(\d+\/udp),{0,1} {0,1}$/g, '$1');
    }

// =============================================== Работа с подключениями к СХД ========================================

    /**
     * Вернуть элемент массива подключений к СХД.
     *
     * @param id
     * @param destroy
     * @param name
     * @param value
     * @returns {{id: *, destroy: *, name: *, value: *}}
     * @private
     */
    function _singleStorage(id, destroy, name, value) {
      return {
        id:       id,
        destroy:  destroy,
        name:     name,
        value:    value
      }
    }

    /**
     * Заполнить данными переменные параметры пункта "Подключения к СХД".
     *
     * @param index - номер строки подключения к СХД (начиная с 0)
     * @returns {string}
     * @private
     */
    function _checkFirstStorage(index) {
      var name = '';

      if (index == 0) // Если первый элемент
        name = 'Подключение к СХД';

      return name;
    }

    /**
     * Функция, создающая массив подключений к СХД.
     *
     * @param storages - массив существующих подключений к СХД
     * @private
     */
    function _generateStorageArr(storages) {
      // id в БД
      var id      = null;
      // Флаг удаления записи (0 - не удалять из БД, 1 - удалять)
      var destroy = 0;
      // Имя в первом столбце таблицы ("Подключение с СХД" или пустая строк)
      var name;
      // Значение, указываемое в поле "Подключение к СХД"
      var value   = null;

      for (var index = 0; index < visible_storage_count; index++) {
        name = _checkFirstStorage(index);
        service.storages.push(_singleStorage(id, destroy, name, value));
      }

      // Для существующих подключений к СХД
      if (storages)
        $.each(storages, function (index, value) {
          id    = value.id;
          name  = _checkFirstStorage(index);

          service.storages[index] = _singleStorage(id, destroy, name, value);
        });
    }

// =============================================== Работа с файлами ====================================================

    /**
     * Установить элемент объекта отсутствующих файлов (additional.missing_file).
     *
     * @param scan
     * @param act
     * @param instr_rec
     * @param instr_off
     * @private
     */
    function _setMissingFileData(scan, act, instr_rec, instr_off) {
      additional.missing_file.scan      = scan;
      additional.missing_file.act       = act;
      additional.missing_file.instr_rec = instr_rec;
      additional.missing_file.instr_off = instr_off;
    }

    /**
     * Заполнить объект additional.file_flags.
     *
     * @param scan
     * @param act
     * @param instr_rec
     * @param instr_off
     * @private
     */
    function _setFileFlagsData(scan, act, instr_rec, instr_off) {
      additional.file_flags.scan      = scan;
      additional.file_flags.act       = act;
      additional.file_flags.instr_rec = instr_rec;
      additional.file_flags.instr_off = instr_off;
    }

    /**
     * Создать объект флагов, определяющих наличие файла, акта, инструкции по восст. и инструкции по откл.
     *
     * @param data - объект, содержащий флаги наличия/отсутствия файлов
     * @private
     */
    function _setMissingFile(data) {
      if (data)
        _setMissingFileData(data.scan, data.act, data.instr_rec, data.instr_off);
      else
        _setMissingFileData(true, true, true, true);
    }

    /**
     * Создать объект флагов, определяющих наличие файлов, которые были выбраны, но не загружены в систему, а так же
     * определяющих, была ли нажата кнопка "Присутствует"/"Отсутствует" в инструкции по восст./откл.
     *
     * @param data
     * @private
     */
    function _setFileFlags(data) {
      if (data)
        _setFileFlagsData(data.scan, data.act, data.instr_rec, data.instr_off);
      else
        _setFileFlagsData(false, false, false, false);
    }

    /**
     * Установить общий статус файлов
     *
     * @returns {boolean}
     * @private
     */
    function _setTotalFileStatus() {
      // Если нет скана
      if (additional.missing_file.scan)
        additional.total_file_status.scan = additional.file_flags.scan ? true : false;
      else
        additional.total_file_status.scan = true;

      // Если нет акта
      if (additional.missing_file.act)
        additional.total_file_status.act = additional.file_flags.act ? true : false;
      else
        additional.total_file_status.act = true;

      // Если нет инструкции по восст.
      if (additional.missing_file.instr_rec)
        additional.total_file_status.instr_rec = additional.file_flags.instr_rec ? true : false;
      else
        additional.total_file_status.instr_rec = true;

      // Если нет инструкции по выкл.
      if (additional.missing_file.instr_off)
        additional.total_file_status.instr_off = additional.file_flags.instr_off ? true : false;
      else
        additional.total_file_status.instr_off = true;
    }

// =============================================== Работа с сервисам-родителями ========================================

    /**
     * Создать массив зависимостей формуляра.
     *
     * @param parents - текущий массив зависимостей, полученный с сервера
     * @private
     */
    function _generateParentArr(parents) {
      if (parents)
        $.each(parents, function (index, parent) {
          service.parents.push(parent);
        });
    }

    /**
     * Добавить зависимость формуляра.
     *
     * @private
     */
    function _addParent() {
      // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить
      // случай, когда сервис-родитель = текущему сервису)
      $.each(service.old_data.services, function (index, value) {
        if (value.name != current_name) {
          var data = {
            parent_id:      value.id,
            parent_service: value,
            destroy:        0
          };
          service.parents.push(data);

          return false;
        }
      });
    }

// =============================================== Работа с приоритетом функционирования ===============================

    /**
     * Установить приоритет функционирования сервиса.
     *
     * @param priority
     * @param deadline
     * @private
     */
    function _generatePriority(priority, deadline) {
      service.priority.values = _getOldServiceData('priorities'); // Список всех возможных приоритетов функционирования

      if (priority) {
        service.priority.selected = priority;

        // Если время ранее не было установлено (сервис не был в категории "Тестирование и отладка")
        if (deadline != null)
          service.priority.deadline = new Date(deadline);
      }
      else
        service.priority.selected = service.priority.values[0];
    }

// =============================================== Публичные методы ====================================================

// =============================================== Методы, вызываемые при инициализации ================================

    /**
     * Инициализация фабрики (вызывать только один раз).
     *
     * @methodOf DataCenter.Service
     * @param id - id сервиса
     * @param name - имя сервиса
     * @param data - данные, полученные с сервера
     */
    self.init = function (id, name, data) {
      current_id       = id;
      current_name     = name;
      service.old_data = data;

      //Для нового сервиса
      if (current_id == 0) {
        _generatePriority();
        _setMissingFile();
        _setFileFlags();
        _generateNetworkArr();
        _generateStorageArr();
      }
      //Для существующего сервиса
      else {
        _generatePriority(_getOldServiceData('priority'), _getOldServiceData('deadline'));
        _setMissingFile(_getOldServiceData('missing_file'));
        _setFileFlags(_getOldServiceData('file_flags'));
        _generateNetworkArr(_getOldServiceData('service_networks'));
        _generateStorageArr(_getOldServiceData('storage_systems'));
        _generateParentArr(_getOldServiceData('parents'));
      }

      _setTotalFileStatus();
      _setFirstNetworkElement();
    };

    /**
     * Получить данные об установленных флагах.
     *
     * @methodOf DataCenter.Service
     * @param name - необязательный параметр. Имя запрашиваемого флага
     * @returns {*}
     */
    self.getFlags = function (name) {
      if (name)
        return additional.flags[name];

      return additional.flags;
    };

    /**
     * Получить данные о приоритете фуонкционирования сервиса.
     *
     * @methodOf DataCenter.Service
     * @returns {service.priority|{selected, values, deadline}}
     */
    self.getPriorities = function () {
      return service.priority;
    };

    /**
     * Получить данные о подключениях к сети.
     *
     * @methodOf DataCenter.Service
     * @returns {service.network|{selected, values}}
     */
    self.getNetworks = function () {
      return service.network;
    };

    /**
     * Получить данные об открытых портах.
     *
     * @methodOf DataCenter.Service
     * @returns {{local: string, inet: string}}
     */
    self.getPorts = function () {
      // Получить список портов, доступных из ЛС для vlan от 1 до 4094
      function get_local_ports(value) {
        // Проверка на существование подключения к сети
        if (value.value == null)
          return false;

        var
          tmp   = [],
          flag  = 0;

        let vlan = isNaN(value.value.vlan) ? 0 : parseInt(value.value.vlan);

        if (value.ports.local_tcp_ports && (vlan >= 1 && vlan <= 4094)) {
          tmp.push(_setPortSuffix(value.ports.local_tcp_ports, 'tcp'));
          flag = 1
        }
        if (value.ports.local_udp_ports && (vlan >= 1 && vlan <= 4094)) {
          tmp.push(_setPortSuffix(value.ports.local_udp_ports, 'udp'));
          flag = 1
        }

        if (flag)
          ports.local += value.value.dns_name + ': ' + tmp.join(", ") + '; ';
      }

      // Получить список портов, доступных из сети Интернет
      function get_inet_ports(value) {
        // Проверка на существование подключения к сети
        if (value.value == null)
          return false;

        var
          tmp   = [],
          flag  = 0;

        if (value.ports.inet_tcp_ports) {
          tmp.push(_setPortSuffix(value.ports.inet_tcp_ports, 'tcp'));
          flag = 1
        }
        if (value.ports.inet_udp_ports) {
          tmp.push(_setPortSuffix(value.ports.inet_udp_ports, 'udp'));
          flag = 1
        }

        if (flag)
          ports.inet += value.value.dns_name + ': ' + tmp.join(", ") + '; ';
      }

      ports.local = '';
      ports.inet = '';

      $.each(service.network.values, function (index, value) {
        get_local_ports(value);
        get_inet_ports(value);
      });

      return ports;
    };

    /**
     * Получить данные о подключениях к СХД.
     *
     * @methodOf DataCenter.Service
     * @returns {Array}
     */
    self.getStorages = function () {
      return service.storages;
    };

    /**
     * Получить данные о загруженых файлах.
     *
     * @methodOf DataCenter.Service
     * @returns {additional.missing_file|{}}
     */
    self.getMissingFiles = function () {
      return additional.missing_file;
    };

    /**
     * Получить данные о наличии флагов file_flags (см. описание переменной additional.file_flags).
     *
     * @methodOf DataCenter.Service
     * @returns {additional.has_instructions|{}}
     */
    self.getFileFlags = function () {
      return additional.file_flags;
    };

    /**
     * Получить общий статус наличия/отсутствия инструкций.
     *
     * @methodOf DataCenter.Service
     * @returns {additional.total_file_status|{}}
     */
    self.getTotalFileStatus = function () {
      return additional.total_file_status;
    };

    /**
     * Получить данные о родителях-сервисах.
     *
     * @methodOf DataCenter.Service
     * @returns {Array}
     */
    self.getParents = function () {
      return service.parents;
    };

    /**
     * Получить список существующих сервисов.
     *
     * @methodOf DataCenter.Service
     * @returns {*}
     */
    self.getServices = function () {
      return service.old_data.services;
    };

// =============================================== Методы для работы контроллера =======================================

// =============================================== Работа с подключениями к сети =======================================

    /**
     * Добавить подключение к сети.
     *
     * @methodOf DataCenter.Service
     */
    self.addNetwork = function () {
      var
        index   = service.network.values[service.network.values.length - 1].local_id + 1,
        obj     = _checkFirstNetwork(index),
        params  = _defaultNetworkParams(index),
        data    = _singleNetwork(index, params.id, params.destroy, obj.name, obj.is_first, params.view, params.hide, params.value, params.ports);

      service.network.values.push(data);
      _setFirstNetworkElement();
      visible_network_count++;
    };

    /**
     * Получить объект "Подключения к сети" для модального окна. Если отсутствует, сначала создать пустой объект.
     *
     * @methodOf DataCenter.Service
     * @param index
     * @returns {*}
     */
    self.getNetworkTemplate = function (index) {
      if (service.network.values[index].value == null)
        service.network.values[index].value = _singleNetworkTemplate('', '', '');

      return service.network.values[index].value;
    };

    /**
     * Записать новые данные о подключении к сети
     *
     * @methodOf DataCenter.Service
     * @param index - индекс массива
     * @param data - данные в поле value
     * @param type - тип события (new - новая запись, cancel - нажата кнопка "Отмена")
     */
    self.setNetwork = function (index, data, type) {
      if (_checkTemplateNetworkPassed(data)) {
        self.setFlag('networkModal', false); // Закрыть модальное окно в случае успешной проверки валидации полей

        service.network.values[index].value = data;
        service.network.values[index].view  = _setNetworkString(data);

        // Для случая, когда:
        // 1. Подключение к сети создано в одной из первых двух строк таблицы (эти строки всегда видны)
        // 2. Подключение к сети было только что удалено (в скрытое поле установлен параметр _destroy = 1)
        // 3. На его месте создается другое подключение к сети
        // Необходимо установить парамет _destroy = 1, чтобы на стороне сервера подключение создалось. Если парамтр не
        // изменить, то старое подключение удалится, новое не создастся.
        // Необходимо сбросить значения полей открытых портов
        if (type == 'new') {
          service.network.values[index].destroy = 0;
          service.network.values[index].ports   = _defaultPorts(index);
        }

        // В случае, если порты не определены, установить значения по умолчанию
        // Для случая, когда создается новая завись
        if (!service.network.values[index].ports)
          service.network.values[index].ports = _defaultPorts(index);
        else
          this.getPorts();
      }
      else {
        if (type != 'cancel')
          alert("Необходимо заполнить все поля.");
        //service.network.values[index].value = null;
      }

      _setFirstNetworkElement();
    };

    /**
     * Удалить подключение к сети
     *
     * @methodOf DataCenter.Service
     * @param network - удаляемый объект массива {@link service.network.values}
     */
    self.delNetwork = function (network) {
      // Индекс удаляемого элемента
      var index = $.inArray(network, service.network.values);

      // Если количество строк больше двух, то строку можно удалять, иначе необходимо просто стирать данные
      if (visible_network_count > 2) {
        if (network.first) { // если удаляется первый элемент, то добавить к седующему надпись "Подключение к сети"
          var obj = _checkFirstNetwork(0);
          service.network.values[index + 1].name  = obj.name;
          service.network.values[index + 1].first = obj.is_first;
        }
        if (network.id) {  // Если элемент уже в базе, то установить флаг на удаление
          service.network.values[index].destroy = 1;
          service.network.values[index].hide    = true;
          service.network.values[index].first   = false;
          service.network.values[index].value   = null;
        }
        else
          service.network.values.splice(index, 1); // Если элемента в базе нет (элемент был только что создан), то
        // удалить элемент из массива

        visible_network_count--;
      }
      else {
        if (network.id)
          service.network.values[index].destroy = 1;

        service.network.values[index].view  = '';
        service.network.values[index].value = null;
      }

      _setFirstNetworkElement();

      // Обновить строки "Сетевые порты, доступные из ЛС" и "Сетевые порты, доступные из сети Интернет"
      this.getPorts();
    };

// =============================================== Работа с открытыми портами ==========================================

    /**
     * Получить список открытых портов
     *
     * @methodOf DataCenter.Service
     * @returns {Array}
     */
    self.getCurrentPorts = function () {
      template_ports = [];
      $.each(service.network.values, function (index, network) {
        if (network.value)
          template_ports.push(network.ports);
      });

      return template_ports;
    };

    /**
     * Сохранить новые значения открытых портов
     *
     * @methodOf DataCenter.Service
     * @param new_ports
     */
    self.setPorts = function (new_ports) {
      //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
      $.each(new_ports, function (i, port) {
        $.each(service.network.values, function (j, network) {
          if (port.local_id == network.local_id) {
            if (!_checkTemplatePortPassed(port))
              network.ports.destroy = 1;

            network.ports = _filterPorts(port);
            return false;
          }
        });
      });

      // Обновить строки "Сетевые порты, доступные из ЛС" и "Сетевые порты, доступные из сети Интернет"
      this.getPorts();
    };

// =============================================== Работа с сервисам-родителями ========================================

    /**
     * Добавить сервис-родитель
     *
     * @methodOf DataCenter.Service
     * @returns {boolean}
     */
    self.addParent = function () {
      // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
      if (service.old_data.services.length == 1 && current_id != 0) { // Если формуляр единственный и он редактируется
        alert('Для создания зависимостей необходимо добавить больше сервисов');
        return false;
      }

      _addParent();
    };

    /**
     * Показать запись "Отсутствуют", если родителей нет
     *
     * @methodOf DataCenter.Service
     * @returns {boolean}
     */
    self.showParents = function () {
      var show = 1;
      $.each(service.parents, function (index, parent) {
        if (!parent.destroy) {
          show = 0;
          return false;
        }
      });

      return show ? true : false
    };

    /**
     * Удалить сервис-родитель
     *
     * @methodOf DataCenter.Service
     * @param parent
     */
    self.delParent = function (parent) {
      var index = $.inArray(parent, service.parents);

      if (parent.id) // Для уже существующих родителей
        service.parents[index].destroy = 1;
      else // Для только что созданных родителей
        service.parents.splice(index, 1);
    };

// =============================================== Работа с файлами ====================================================

    /**
     * Установить общий статус файлов.
     *
     * @methodOf DataCenter.Service
     * @param type - ключ массива additional.file_flags
     * @param value - необязательный параметр. Значение, которое необходимо установить.
     */
    self.changeFileFlagStatus = function (type, value) {
      if (value)
        additional.file_flags[type] = value;
      else
        additional.file_flags[type] = additional.file_flags[type] ? false : true;

      _setTotalFileStatus();
    };

    /**
     * Удалить файл
     *
     * @methodOf DataCenter.Service
     * @param event
     * @returns {boolean}
     */
    self.removeFile = function (event) {
      var
        target = event.target,
        confirm_str = 'Вы действительно хотите удалить ';

      switch (target.attributes['data-type'].value) {
        case 'scan':
          confirm_str += 'скан?';
          break;
        case 'act':
          confirm_str += 'акт?';
          break;
        case 'instr_rec':
          confirm_str += 'инструкцию по восстановлению?';
          break;
        case 'instr_off':
          confirm_str += 'инструкцию по отключению?';
          break;
        default:
          confirm_str += 'файл?';
      }

      if (!confirm(confirm_str))
        return false;

      $http.delete(target.attributes.href.value + '.json').success(function (data, status) {
        if (status == 200) {
          Flash.notice(data.message);

          _setMissingFile(data.missing_file);
          _setFileFlags(data.file_flags);
          _setTotalFileStatus();
        }
        else
          Flash.alert(data.message);
      });
    };

// =============================================== Работа с флагами ====================================================

    /**
     * Установить значение указанного флага
     *
     * @methodOf DataCenter.Service
     * @param name - имя флага
     * @param value - устанавливаемое значение
     */
    self.setFlag = function (name, value) {
      additional.flags[name] = value;

      // Для модального окна "Открытые порты" каждый раз, когда окно закрывается, устанавливать первый элемент
      // списка подключений к сети выбранным в select.
      if (name == 'portModal' && !value)
        _setFirstNetworkElement();
    };
  }

// =====================================================================================================================

  /**
   * Сервис, содержащий различные вспомогательные функции
   *
   * @class DataCenter.ServiceShareFunc
   */
  function ServiceShareFunc() {
    var self = this;

    /**
     * Получить иконку приоритета функционирования
     *
     * @methodOf DataCenter.ServiceShareFunc
     * @param flag - объект, содержащий такие параметры сервиса, как exploitation, priority, deadline
     * @returns {*}
     */
    self.priority = function (flag) {
      var str; // Возвращаемая строка

      if (flag.exploitation)
        switch (flag.priority) {
          case 'Критическая производственная задача':
            str = '<i class="fa fa-star" tooltip-placement="top" uib-tooltip="Критическая производственная' +
              ' задача"></i>';
            break;
          case 'Вторичная производственная задача':
            str = '<i class="fas fa-star-half-alt" tooltip-placement="top" uib-tooltip="Вторичная производственная' +
              ' задача"></i>';
            break;
          case 'Тестирование и отладка':
            str = '<i class="far fa-star" tooltip-placement="top" uib-tooltip="Тестирование и отладка"></i>';
            break;
          default:
            str = '<i class="fa fa-question" tooltip-placement="top" uib-tooltip="Приоритет функционирования не' +
              ' определен"></i>';
            break;
        }
      else
        str = '<i class="fa fa-cogs" tooltip-placement="top" uib-tooltip="Сервис не в эксплуатации"></i>';

      if (flag.deadline)
        str = '</i><i class="fa fa-exclamation-triangle" tooltip-placement="top" uib-tooltip="Срок тестирования' +
          ' сервиса окончен"></i>';

      return str;
    }
  }
})();