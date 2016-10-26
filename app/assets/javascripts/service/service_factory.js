(function() {
  'use strict';

  app
    .service('Service', Service)
    .service('ServiceCookies', ServiceCookies);

  Service.$inject         = ['$http', 'Flash'];
  ServiceCookies.$inject  = ['$cookies'];

// =============================================== Создание/редактирование сервиса =====================================

  function Service($http, Flash) {
    var self = this;

    // Переменные, используемые только внутри фабрики
    var
      visible_network_count = 2,    // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
      visible_storage_count = 2,    // Количество строк "Подключения к СХД", видимых пользователем
      current_id,
      current_name,
      template_ports        = [],
      ports                 = {     // Объект, содержащий строки открытых портов, доступных из ЛС и сети Интернет
        local:  '',
        inet:   ''
      };

    // Переменные, которые возвращаются контроллеру
    var
      service = {                 // Основные данные сервера
        old_data: null,           // Данные, полученные с сервера
        priority: {
          selected:   null,       // Используется в качестве модели для первого элемента в поле select "Приоритет функционирования"
          values:     [],         // Массив приоритетов функционирования
          deadline:  new Date()   // Срок тестирования
        },
        network: {
          selected: null,         // Используется в качестве модели для первого элемента в модальном окне "Открытые порты"
          values:   []            // Массив подключений к сети
        },
        parents:  [],             // Массив сервисов-родителей
        storages: []              // Массив подключений к СХД
      },
      additional = {              // Дополнительные данные, необходимые для работы страницы
        flags:            {
          networkModal: false,    // Флаг, определяющий, скрывать модальное окно "Подключения к сети" или нет
          portModal:    false     // Флаг, определяющий, скрывать модальное окно "Открытые порты" или нет
        },
        missing_file:    {}       // Объект, содержащий флаги, которые показывают отсутствующие файлы
      };

// =============================================== Приватные методы ====================================================

    // Получить данные о сервисе
    function _getOldServiceData(name) {
      if (name)
        return service.old_data[name] ? service.old_data[name] : null;

      return service.old_data;
    }

// =============================================== Работа с подключениями к сети =======================================

    // Создает строку, которую видит пользователь в поле "Подключение к сети"
    function _setNetworkString(data) {
      return [data.segment, data.vlan, data.dns_name].join(', ');
    }

    // Функция, заполняющая данными переменные параметры пункта "Подключения к сети"
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

    // Установить начальное значение для подключений к сети
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

    // Элемент массива подключений к сети
    function _singleNetwork(index, id, destroy, name, first, view, hide, value, ports) {
      return {
        local_id: index,    // Индекс, необходимый для связывания массива networks с массивом открытых портов (template_ports)
        id:       id,       // id в базе данных
        destroy:  destroy,  // Если 1 - удалить из базы
        name:     name,     // Наименование в первом столбце для первой строки
        first:    first,    // Для первого элемента (чтобы знать, писать ли наименование "Подключения к сети")
        view:     view,     // Выводимая на экран строка
        hide:     hide,     // Если true - скрыть от пользователя (при нажатии кнопки "Удалить")
        value:    value,    // Массив объектов, записываемых в базу (Сегмент, VLAN, DNS-имя)
        ports:    ports     // Массив объектов с перечислением открытых портов
      }
    }

    // Функция, создающая массив подключений к сети
    // networks - объект, содержащий данные существующих подключений к сети
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

    //Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
    function _setFirstNetworkElement() {
      $.each(service.network.values, function (index, network) {
        if (network.value != null && network.view != '') {
          service.network.selected = network;

          return false;
        }
      });
    }

    // Элемента массива подключений к сети
    function _singleNetworkTemplate(segment, vlan, dns_name) {
      return {
        segment:  segment,
        vlan:     vlan,
        dns_name: dns_name
      }
    }

    // Проверка корректности данных подключений к сети
    function _checkTemplateNetworkPassed(data) {
      return data != null && (data.segment != '' && data.vlan != '' && data.dns_name != '');
    }

// =============================================== Работа с открытыми портами ==========================================

    //Установить начальное значение открытых портов
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

    // Проверка корректности данных открытых портов
    function _checkTemplatePortPassed(data) {
      return data.local_tcp_ports != '' || data.local_udp_ports != '' || data.inet_tcp_ports != '' || data.inet_udp_ports != '';
    }

    // Провести входные данные открытых портов через фильтр регулярных выражений (для корректного отображения данных).
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

    // Установть tcp/udp суффикс к указанным портам
    // data - Строка, содержащая список портов и прошедшая фильтрация через функцию _filterPorts
    // suffix - Строка, содержщая суффикс(tcp, udp), который необходимо добавить к портам, указанным в data
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

    // Элемент массива подключений к СХД
    function _singleStorage(id, destroy, name, value) {
      return {
        id:       id,
        destroy:  destroy,
        name:     name,
        value:    value
      }
    }

    // Функция, заполняющая данными переменные параметры пункта "Подключения к СХД"
    function _checkFirstStorage(index) {
      var name = '';

      if (index == 0) // Если первый элемент
        name = 'Подключение к СХД';

      return name;
    }

    // Функция, создающая массив подключений е СХД
    function _generateStorageArr(storages) {
      var
        id      = null, // id в БД
        destroy = 0,    // Флаг удаления записи (0 - не удалять из БД, 1 - удалять)
        name,           // Имя в первом столбце таблицы ("Подключение с СХД" или пустая строк)
        value   = null; // Значение, указываемое в поле "Подключение к СХД"

      for (var index = 0; index < visible_storage_count; index++) {
        name = _checkFirstStorage(index);
        service.storages.push(_singleStorage(id, destroy, name, value));
      }

      // Для существующеих подключений к СХД
      if (storages)
        $.each(storages, function (index, value) {
          id    = value.id;
          name  = _checkFirstStorage(index);

          service.storages[index] = _singleStorage(id, destroy, name, value);
        });
    }

// =============================================== Работа с файлами ====================================================

    // Элемент объекта флагов отсутствующих файлов
    function _setMissingFileData(scan, act, instr_rec, instr_off) {
      additional.missing_file.scan      = scan;
      additional.missing_file.act       = act;
      additional.missing_file.instr_rec = instr_rec;
      additional.missing_file.instr_off = instr_off;
    }

    // Функция, создающая массив флагов, определяющих наличие файла, акта, инструкции по восст. и инструкции по откл.
    function _setMissingFile(data) {
      if (data)
        _setMissingFileData(data.scan, data.act, data.instr_rec, data.instr_off);
      else
        _setMissingFileData(true, true, true, true);
    }

// =============================================== Работа с сервисам-родителями ========================================

    // Функция, создающая массив зависимостей формуляра
    function _generateParentArr(parents) {
      if (parents)
        $.each(parents, function (index, parent) {
          service.parents.push(parent);
        });
    }

    function _addParent() {
      // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить случай, когда сервис-родитель = текущему сервису)
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

    // Функция инициализации фабрики (вызывать только один раз)
    self.init = function (id, name, data) {
      current_id       = id;    // Id формуляра
      current_name     = name;  // Имя формуляра
      service.old_data = data;  //Данные, полученные с сервера

      //Для нового сервиса
      if (current_id == 0) {
        _generatePriority();
        _setMissingFile();
        _generateNetworkArr();
        _generateStorageArr();
      }
      //Для существующего сервиса
      else {
        _generatePriority(_getOldServiceData('priority'), _getOldServiceData('deadline'));
        _setMissingFile(_getOldServiceData('missing_file'));
        _generateNetworkArr(_getOldServiceData('service_networks'));
        _generateStorageArr(_getOldServiceData('storage_systems'));
        _generateParentArr(_getOldServiceData('parents'));
      }

      _setFirstNetworkElement();
    };

    // Получить данные об установленных флагах
    self.getFlags = function (name) {
      if (name)
        return additional.flags[name];

      return additional.flags;
    };

    // Получить данные о приоритете фуонкционирования
    self.getPriorities = function () {
      return service.priority;
    };

    // Получить данные о подключениях к сети
    self.getNetworks = function () {
      return service.network;
    };

    // Получить данные об открытых портах
    self.getPorts = function () {
      // Получить список портов, доступных из ЛС для vlan 500
      function get_local_ports(value) {
        // Проверка на существование подключения к сети
        if (value.value == null)
          return false;

        var
          tmp   = [],
          flag  = 0;

        if (value.ports.local_tcp_ports && /500/.test(value.value.vlan)) {
          tmp.push(_setPortSuffix(value.ports.local_tcp_ports, 'tcp'));
          flag = 1
        }
        if (value.ports.local_udp_ports && /500/.test(value.value.vlan)) {
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

    // Получить данные о подключениях к СХД
    self.getStorages = function () {
      return service.storages;
    };

    // Получить данные о загруженых файлах
    self.getMissingFiles = function () {
      return additional.missing_file;
    };

    // Получить данные о родителях-сервисах
    self.getParents = function () {
      return service.parents;
    };

    // Получить список существующих сервисов
    self.getServices = function () {
      return service.old_data.services;
    };

// =============================================== Методы для работы контроллера =======================================

// =============================================== Работа с подключениями к сети =======================================

    // Добавить подключение к сети
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

    // Получить объект "Подключения к сети" для модального окна. Если отсутствует, сначала создать пустой объект
    self.getNetworkTemplate = function (index) {
      if (service.network.values[index].value == null)
        service.network.values[index].value = _singleNetworkTemplate('', '', '');

      return service.network.values[index].value;
    };

    // Записать новые данные о подключении к сети
    // index  - индекс массива
    // data   - данные в поле value
    // newRec - новая запись
    self.setNetwork = function (index, data, newRec) {
      if (_checkTemplateNetworkPassed(data)) {
        service.network.values[index].value = data;
        service.network.values[index].view  = _setNetworkString(data);

        // Для случая, когда:
        // 1. Подключение к сети создано в одной из первых двух строк таблицы (эти строки всегда видны)
        // 2. Подключение к сети было только что удалено (в скрытое поле установлен параметр _destroy = 1)
        // 3. На его месте создается другое подключение к сети
        // Необходимо установить парамет _destroy = 1, чтобы на стороне сервера подключение создалось. Если парамтр не
        // изменить, то старое подключение удалится, новое не создастся.
        // Необходимо сбросить значения полей открытых портов
        if (newRec) {
          service.network.values[index].destroy = 0;
          service.network.values[index].ports   = _defaultPorts(index);
        }

        // В случае, если порты не определены, установить значения по умолчанию
        // Для случая, когда создается новая завись
        if (!service.network.values[index].ports)
          service.network.values[index].ports = _defaultPorts(index);
        else
          self.getPorts();
      }
      else
        service.network.values[index].value = null;

      _setFirstNetworkElement();
    };

    // Удалить подключение к сети
    self.delNetwork = function (network) {
      var index = $.inArray(network, service.network.values); // Индекс удаляемого элемента

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
          service.network.values.splice(index, 1); // Если элемента в базе нет (элемент был только что создан), то удалить элемент из массива

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
      self.getPorts();
    };

// =============================================== Работа с открытыми портами ==========================================

    // Получить список с открытыми портами
    self.getCurrentPorts = function () {
      template_ports = [];
      $.each(service.network.values, function (index, network) {
        if (network.value)
          template_ports.push(network.ports);
      });

      return template_ports;
    };

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
      self.getPorts();
    };

// =============================================== Работа с сервисам-родителями ========================================

    // Добавить сервис-родитель
    self.addParent = function () {
      // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
      if (service.old_data.services.length == 1 && current_id != 0) { // Если формуляр единственный и он редактируется
        alert('Для создания зависимостей необходимо добавить больше сервисов');
        return false;
      }

      _addParent();
    };

    // Показать запись "Отсутствуют", если родителей нет
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

    // Удалить сервис-родитель
    self.delParent = function (parent) {
      var index = $.inArray(parent, service.parents);

      if (parent.id) // Для уже существующих родителей
        service.parents[index].destroy = 1;
      else // Для только что созданных родителей
        service.parents.splice(index, 1);
    };

// =============================================== Работа с файлами ====================================================

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
        }
        else
          Flash.alert(data.message);
      });
    };

// =============================================== Работа с флагами ====================================================

    // Установить значение флага
    self.setFlag = function (name, value) {
      additional.flags[name] = value;

      // Для модального окна "Открытые порты" каждый раз, когда окно закрывается, устанавливать первый элемент списка подключений к сети выбранным в select.
      if (name == 'portModal' && !value)
        _setFirstNetworkElement();
    };
  }

// =============================================== Cookies =============================================================

  function ServiceCookies($cookies) {
    var self = this;

    var service = {
      showOnlyExploitationServices: true
    };

    // Получить cookies
    self.get = function (key) {
      if (angular.isUndefined(key))
        return $cookies.getObject('service');

      return angular.isUndefined($cookies.getObject('service')) ? 'Куки отсутсвуют' : $cookies.getObject('service')[key];
    };

    // Установить cookies
    self.set = function (key, value) {
      service[key] = value;

      $cookies.putObject('service', service);
    };

// =============================================== Инициализация =======================================================

    if (angular.isUndefined($cookies.getObject('service')))
      $cookies.putObject('service', service);
  }
})();