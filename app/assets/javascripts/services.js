app.directive('serviceForm', ['$http', function ($http) {
  return function(scope, element, attrs) {
    scope.visible_count = 2; // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
    scope.networks      = [ // Массив с подключениями к сети
      {
        local_id: 0,
        id:       null,
        destroy:  0,
        name:     'Подключение к сети',
        first:    true,
        view:     '',
        hide:     false,
        value:    null,
        ports:    null
      },
      {
        local_id: 1,
        id:       null,
        destroy:  0,
        name:     '',
        first:    false,
        view:     '',
        hide:     false,
        value:    null,
        ports:    null
      }
    ];
    scope.storages = [ // Массив с подключениями к СХД
      {
        destroy:  0,
        name:     'Подключение к СХД',
        value:    null
      },
      {
        destroy:  0,
        name:     '',
        value:    null
      }
    ];
    scope.missing_file = { // Массив с флагами, определяющими наличие файлов
      scan:       true,
      act:        true,
      instr_rec:  true,
      instr_off:  true
    };
    scope.parents = []; // Массив с сервисами-родителями
    scope.serviceForm = attrs.serviceForm; // Переменная, хранящее id сервиса (если существует) или 0 (если нет)
    scope.current_name = null; // current_name необходим для исключения этого имени из списка родителей-сервисов

    //  Редактирование существующего сервиса
    if (attrs.serviceForm == 0) {
      $http.get('/services/new.json')
        .success(function (data, status, header, config) {
          scope.services    = data.services;
        });
    }
    else {
      $http.get('/services/' + attrs.serviceName + '/edit.json')
        .success(function (data, status, header, config) {
          // Массив со списком существующих сервисов
          scope.services = data.services;

          //Массив со списком родительских сервисов (от которых зависит текщий сервис)
          scope.parents = data.parents;

          // current_name необходим для исключения этого имени из списка родителей-сервисов
          scope.current_name = data.current_name;

          // Заполнение массива файлов скана, акта, инструкций (если файл отсутствует => true)
          scope.missing_file = data.missing_file;

          // Настройка полей подключений к сети
          // Для существующего сервиса либо получить количество подключений к сети (если их больше 2), либо установить равным 2
          if (data.service_networks.length > 2)
            scope.visible_count = data.service_networks.length;
          else
            scope.visible_count = 2;

          $.each(data.service_networks, function (index, value) {
            scope.networks[index] = {
              local_id: index,    // Индекс, необходимый для связывания массива networks с массивом открытых портов (template_ports)
              id:       null,     // id в базе данных
              destroy:  0,        // Если 1 - удалить из базы
              name:     '',       // Наименование в первом столбце для первой строки
              first:    false,    // Для первого элемента (чтобы знать, писать ли наименование "Подключения к сети")
              view:     null,     // Выводимая на экран строка
              hide:     false,    // Если true - скрыть от пользователя (при нажатии кнопки "Удалить")
              value:    null,     // Массив объектов, записываемых в базу (Сегмент, VLAN, DNS-имя)
              ports:    null      // Массив объектов с перечислением открытых портов
            };

            // Заполнение данных в массив из базы
            // Для первого элемента добавить запись 'Подключение к сети'
            if (index == 0) {
              scope.networks[index].name  = 'Подключение к сети';
              scope.networks[index].first = true;
              scope.selected_network = scope.networks[0]; // Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
            }
            else
              scope.networks[index].name = null;

            scope.networks[index].id              = value.id;
            scope.networks[index].value           = value;
            scope.networks[index].view            = [value.segment, value.vlan, value.dns_name].join(", ");
            scope.networks[index].ports           = value.service_port;
            scope.networks[index].ports.local_id  = index;

            // Удалить id из внутреннего массива
            delete scope.networks[index].value.id;
          });

          //Настройка полей подключений к СХД
          $.each(data.storage_systems, function (index, value) {
            scope.storages[index].id    = value.id;
            scope.storages[index].value = value;
          });
        });
    }
  }
}]);

app.controller('ServiceEditCtrl', ['$scope', '$element', function ($scope, $element) {

  // Добавить сервис-родитель
  $scope.addParent = function () {
    // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
    if ($scope.services.length == 1 && $scope.serviceForm != 0) { // Если формуляр единственный и он редактируется
      alert('Для создания зависимостей необходимо добавить больше сервисов');
      return false;
    }
    //else if ($scope.services.length == 1 && $scope.serviceForm == 0) {

    //}

    // Проход по циклу для проверки, какой сервис поставить первым в тэге select (нужно для того, что исключить случай, когда сервис-родитель = текущему сервису)
    $.each($scope.services, function (index, value) {
      if (value.name != $scope.current_name) {
        $scope.parents.push({
          parent_id: $scope.services[index].id,
          parent_service: $scope.services[index],
          destroy: 0
        });
        return false;
      }
    });
  };

  // Удалить сервис-родитель
  $scope.delParent = function (parent) {
    if (parent.id)
      parent.destroy = 1;
    else
      $scope.parents.splice($.inArray(parent, $scope.parents), 1);
  };

  // Фильтр, определяющий, показывать ли надпись "Отсутствует" в поле родителей-сервисов
  $scope.showParents = function () {
    var show = 1;
    $.each($scope.parents, function (index, value) {
      if (!value.destroy) {
        show = 0;
        return false;
      }
    });

    return show ? true: false
  };

  // Отключение ссылок на скачивание и удаление файлов
  $scope.disabledLink = function (missing, $event) {
    if (missing)
      $event.preventDefault();
    else {
      var target = $event.target;

      if (target.attributes['data-link-type'].value == 'destroy') {
        var is_destroy = confirm('Вы действительно хотите удалить ' + target.attributes['data-type'].value);

        if (!is_destroy)
          $event.preventDefault();
      }
    }

    return false;
  };

  $scope.showNetworkModal = function ($event, $index) {
    var modal = $('#networkModal');

    // Получаем индекс строки, данные о которой необходимо изменить
    $scope.index = $index;

    // Если в строке не было данных, создать пустой шаблон для заполнения полей окна "Подключения к сети"
    if ($scope.networks[$index].value == null)
      $scope.template_network = {
        segment:  '',
        vlan:     '',
        dns_name: ''
      };
    // Если данные уже были, заполнить ими строки
    else
      $scope.template_network = {
        segment:  $scope.networks[$index].value.segment,
        vlan:     $scope.networks[$index].value.vlan,
        dns_name: $scope.networks[$index].value.dns_name
      };

    modal.modal('show');

    // Добавить автофокус на поле "Сегмент сети" после открытия модального окна "Подключения к сети"
    modal.on('shown.bs.modal', function () {
      $("#template_network_segment").focus();
    })
  };

  // Закрыть модальное окно по нажатии 'Отмена'
  $scope.closeNetworkModal = function () {
    $('#networkModal').modal('hide');
  };

  // Закрыть модальное окно по нажатии 'Готово'
  $scope.readyNetworkModal = function () {
    $('#networkModal').modal('hide');

    // Изменить данные элемента массива networks (если все строки были заполнены)
    if ($scope.template_network.segment != '' && $scope.template_network.vlan != '' && $scope.template_network.dns_name != '') {
      $scope.networks[$scope.index].value = $scope.template_network;
      $scope.networks[$scope.index].view  = [$scope.template_network.segment, $scope.template_network.vlan, $scope.template_network.dns_name].join(", ");
      if ($scope.networks[$scope.index].ports == null) {
        $scope.networks[$scope.index].ports = {
          id:               null,
          destroy:          0,
          local_tcp_ports:  '',
          local_udp_ports:  '',
          inet_tcp_ports:   '',
          inet_udp_ports:   ''
        }
      }
    }

    // Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
    $.each($scope.networks, function (index, value) {
      if (value.value != null && value.view != '') {
        $scope.selected_network = value;
        return false;
      }
    });
  };

  // Добавить строку 'Подключения к сети'
  $scope.addNetwork = function () {
    var id = $scope.networks[$scope.networks.length - 1].local_id + 1;

    $scope.networks.push({
      local_id: id,
      name:     '',
      first:    false,
      view:     null,
      hide:     false,
      value:    null,
      ports:    null
    });
    $scope.visible_count ++;

    // Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
    $.each($scope.networks, function (index, value) {
      if (value.value != null && value.view != '') {
        $scope.selected_network = value;
        return false;
      }
    });
  };

  // Удалить строку 'Подключения к сети'
  $scope.delNetwork = function (network) {

    var index = $.inArray(network, $scope.networks); // Индекс удаляемого элемента в массивах

    // Если количество строк больше двуз, то строку можно удалять, иначе необходимо просто стирать данные
    if ($scope.visible_count > 2) {
      if (index == 0) { // и если удаляется первый элемент, то добавить к седующему надпись 'Подключение к сети'
        network.hide                      = true;
        $scope.networks[index + 1].name   = 'Подключение к сети';
        $scope.networks[index + 1].first  = true;
      }

      if (network.id) { // Если элемент уже в базе, то установить флаг на удаление
        if (network.ports != null && network.ports.id)
          network.ports.destroy = 1;
        else
          network.ports = null;

        network.destroy = 1;
        network.view    = '';
        network.hide    = true;
        network.value   = null;
      }
      else
        $scope.networks.splice(index, 1); // Если элемента в базе нет (элемент был только что создан), то удалить элемент из массива

      $scope.visible_count --;
    }
    else {
      if (network.id)
        network.destroy = 1;

      if (network.ports != null && network.ports.id)
        network.ports.destroy = 1;
      else
        network.ports = null;

      network.view    = '';
      network.value   = null;
    }

    // Установить первый элемент для списка подключений к сети в модальном окне "Открытые порты"
    $.each($scope.networks, function (index, value) {
      if (value.value != null && value.view != '') {
        $scope.selected_network = value;
        return false;
      }
    });
  };

  $scope.showPortsModal = function ($event, $index) {
    var modal = $('#portsModal');

    // Проверка на существующие подключения к сети
    var view_count = 0; // Счетчик количества подключений к сети (Если 0 - не открывать модальное окно)
    $scope.template_index = 0; // Индекс выбранного подключения к сети в модальном окне "Открытые порты"
    $scope.template_ports = []; // Массив открытых портов всех подключений к сети текущего формуляра

    $.each($scope.networks, function (index, value) {
      if (value.view != '') {
        view_count ++;
        $scope.template_ports.push({
          network_id:       value.local_id,
          local_tcp_ports:  value.ports.local_tcp_ports,
          local_udp_ports:  value.ports.local_udp_ports,
          inet_tcp_ports:   value.ports.inet_tcp_ports,
          inet_udp_ports:   value.ports.inet_udp_ports
        });
      }
    });

    if (view_count == 0) {
      $($event.target).blur();
      alert("Необходимо создать \"Подключение к сети\"");

      return true;
    }

    modal.modal('show');
  };

  $scope.readyPortsModal = function () {
    $('#portsModal').modal('hide');

    //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
    $scope.template_ports.forEach(function (port, i, ports_arr) {
      $scope.networks.forEach(function(network, j, networks_arr) {
        if (port.network_id == network.local_id) {
          if (port.local_tcp_ports == '' && port.local_udp_ports == '' && port.inet_tcp_ports == '' && port.inet_udp_ports == '')
            network.ports.destroy = 1;

          network.ports.local_tcp_ports = port.local_tcp_ports;
          network.ports.local_udp_ports = port.local_udp_ports;
          network.ports.inet_tcp_ports = port.inet_tcp_ports;
          network.ports.inet_udp_ports = port.inet_udp_ports;
          return false;
        }
      });
    });
  };

  $scope.closePortsModal = function () {
    $('#portsModal').modal('hide');
  };

  // Фильтр для отображения подключений к сети в модальном окне "Открытые порты"
  $scope.networksFilter = function () {
    return function (network) {
      return network.value != null;
    }
  };

  // Событие после выбора "Подключения к сети" в модальном окне "Открытые порты"
  $scope.changeNetwork = function (old_network) {
    // Получаем новый индекс массива портов (используется в файле _ports в качестве индекса массива template_ports)
    $scope.template_ports.forEach(function (item, i, arr) {
      if (item.network_id == $scope.selected_network.local_id) {
        $scope.template_index = i;
        return false;
      }
    });
  }
}]);

$(function() {
  var
    modal = $('#modal'),
    table = $('#serviceTable').DataTable({
      //dom: '<"row"<"#add_service_block.col-sm-2"><"col-sm-10"f>>',
      dom: '<"row"<"#add_service_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>',
      ajax: {
        url:    'services.json',
        async:  false,
        type:   'get'
        //data: function (data) {
          //var val = $("#serverTypeFilter").find(":selected").val();
          //if (!val)
          //  data.server_type_val = 0;
          //else
          //  data.server_type_val = val;
        //}
      },
      columnDefs: [
        {
          targets: [7, 8, 9, 10, 11],
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'priority',
          content: '#'
        },
        {
          data: 'number',
          width: '85px'
        },
        {
          data: 'name',
          width: '393px'
        },
        {
          data: 'time_work',
          width: '57px'
        },
        {
          data: 'dept',
          width: '50px'
        },
        {
          data: 'contacts',
          width: '207px'
        },
        {
          data: 'scan'
        },
        {
          data: 'act'
        },
        {
          data: 'instr_rec'
        },
        {
          data: 'instr_off'
        },
        {
          data: 'del'
        }
      ],
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showServer();
      },
      initComplete: function (settings, json) {
        // Создать фильтр по типу сервера
        //var select = $('<select class="form-control" id="serverTypeFilter">').appendTo('#data-table-filter');

        //$('<option>').val('0').text('Все типы').appendTo(select);
        //$.each(json.server_types, function(index, value) {
        //  $('<option>').val(value.id).text(value.name).appendTo(select);
        //});

        // Создать кнопку добавления нового сервиса
        $('#add_service_form').appendTo('#add_service_block');

        // Изменить класс у формы поиска
        $('.dataTables_filter input').removeClass('input-sm');
      }
    });

  // Добавить событие для показа информации о формуляре
  table.rows().each(function () {
    this.nodes().to$().attr('ng-click', 'showServiceData()');
  });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    // Удалить созданные строки таблицы
    modal.find('tr.additional-string').remove().find('tr[data-name="network_template"]').attr('data-position', 'last');

    // Очистить текст полей "Подключения к сети"
    modal.find('td[data-name^="network_name"]').each(function () {
      $(this).text('');
    })
  });

  // Фильтр таблицы
  //$('#serverTypeFilter').on('change', function () {
  //  table.ajax.reload(null, false);
  //});

  function showServer() {
    $('#serviceTable > tbody > tr').off().on('click', function (event) {
      self = this;

      if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
        return true;

      $.get('services/' + self.id + '.json', function (data) {
        var
          service       = data.service,
          missing_file  = data.missing_file,
          contacts      = data.contacts;

        // Заполнение таблицы предпросмотра
        modal.find('.modal-body').find('[data-name="name"]').text(service.name)
          .end().find('[data-name="descr"]').text(service.descr)
          .end().find('[data-name="priority"]').text(service.priority)
          .end().find('[data-name="time_work"]').text(service.time_work)
          .end().find('[data-name="max_time_rec"]').text(service.max_time_rec)
          .end().find('[data-name="contact_1"]').text(contacts.first)
          .end().find('[data-name="contact_2"]').text(contacts.second)
          .end().find('[data-name="environment"]').text(service.environment)
          .end().find('[data-name="os"]').text(service.os)
          .end().find('[data-name="component_key"]').text(service.component_key)
          .end().find('[data-name="kernel_count"]').text(service.kernel_count)
          .end().find('[data-name="frequency"]').text(service.frequency)
          .end().find('[data-name="memory"]').text(service.memory)
          .end().find('[data-name="disk_space"]').text(service.disk_space)
          .end().find('[data-name="hdd_speed"]').text(service.hdd_speed)
          .end().find('[data-name="network_speed"]').text(service.network_speed)
          .end().find('[data-name="additional_require"]').text(service.additional_require)
          .end().find('[data-name="backup_manual"]').text(service.backup_manual)
          .end().find('[data-name="recovery_manual"]').text(service.recovery_manual)
          .end().find('[data-name="value_backup_data"]').text(service.value_backup_data)
          .end().find('[data-name="storage_time"]').text(service.storage_time)
          .end().find('[data-name="store_copies"]').text(service.store_copies)
          .end().find('[data-name="backup_volume"]').text(service.backup_volume)
          .end().find('[data-name="backup_window"]').text(service.backup_window)
          .end().find('[data-name="time_recovery"]').text(service.time_recovery)
          .end().find('[data-name="duplicate_ps"]').text(service.duplicate_ps)
          .end().find('[data-name="raid"]').text(service.raid)
          .end().find('[data-name="bonding"]').text(service.bonding)
          .end().find('[data-name="other"]').text(service.other)
          .end().find('[data-name="resiliency"]').text(service.resiliency)
          .end().find('[data-name="time_after_failure"]').text(service.time_after_failure)
          .end().find('[data-name="disaster_rec"]').text(service.disaster_rec)
          .end().find('[data-name="time_after_disaster"]').text(service.time_after_disaster)
          .end().find('[data-name="antivirus"]').text(service.antivirus)
          .end().find('[data-name="firewall"]').text(service.firewall)
          .end().find('[data-name="uac_app_selinux"]').text(service.uac_app_selinux)
          .end().find('[data-name="szi"]').text(service.szi)
          .end().find('[data-name="internet"]').text(service.internet)
          .end().find('[data-name="type_mon"]').text(service.type_mon)
          .end().find('[data-name="service_mon"]').text(service.service_mon)
          .end().find('[data-name="hardware_mon"]').text(service.hardware_mon)
          .end().find('[data-name="security_mon"]').text(service.security_mon)
          .end().find('[data-name="additional_data"]').text(service.additional_data)
          .end().find('[data-name="comment"]').text(service.comment)
          .end().find('[data-name="name_monitoring"]').text(service.name_monitoring);

        // Заполнение шапки
        if (service.number)
          modal.find('.modal-title').text('Формуляр № ***REMOVED***-Ф-' + service.number);
        else
          modal.find('.modal-title').text('Номер формуляра отсутствует');

        // Заполнение полей "Подключение к СХД"
        if (service.storage_systems[0])
          modal.find('[data-name="storage_name[0]"]').text(service.storage_systems[0].name);

        if (service.storage_systems[1])
          modal.find('[data-name="storage_name[1]"]').text(service.storage_systems[1].name);

        // Заполнение полей "Подключения к сети"
        $.each(service.service_networks, function (index, value) {
          var text = [value.segment, value.vlan, value.dns_name].join(', ');

          // Если строк > 2, то для каждой дополнительной строки копировать шаблон
          if (index >= 2) {
            modal.find('tr[data-name="network_template"]').clone().insertAfter('tr[data-position="last"]')
              .addClass('additional-string').attr('data-position', 'last').removeClass('hide').removeAttr('data-name').find("td:nth-child(2)").text(text)
              .end().end().prev().removeAttr('data-position');
          }
          else
            modal.find('td[data-name="network_name[' + index + ']"]').html(text);
        });

        // Удаление/Установка ссылок на кнопки скачивания файлов
        if (missing_file.scan)
          disable_file_link('scan');
        else
          enable_file_link(self.id, 'scan');

        if (missing_file.act)
          disable_file_link('act');
        else
          enable_file_link(self.id, 'act');

        if (missing_file.instr_off)
          disable_file_link('instr_off');
        else
          enable_file_link(self.id, 'instr_off');

        if (missing_file.instr_rec)
          disable_file_link('instr_rec');
        else
          enable_file_link(self.id, 'instr_rec');

        function disable_file_link(name) {
          modal.find('[data-name="' + name + '"]').parent().addClass("disabled");
        }

        function enable_file_link(id, name) {
          modal.find('[data-name="' + name + '"]').attr('href', '/services/' + id + '/download/' + name);
        }

        //Установка ссылок на кнопки генерации формуляра/акта
        modal.find('[data-name="gen_formular"]').attr('href', '/services/' + self.id + '/generate/formular')
          .end().find('[data-name="gen_act"]').attr('href', '/services/' + self.id + '/generate/act');

        // Отключить переход по ссылке, если файл отсутствует
        modal.find('[data-link-type="download"]').each(function () {
          $(this).off().on('click', function (event) {
            if ($(event.target).parent().hasClass('disabled'))
              event.preventDefault();
          });
        });

        // Ссылка на изменение данных о сервере
        modal.find('a[data-id="changeData"]').attr('href', '/services/' + service.name + '/edit');

        modal.modal('show');
      });

      // Событие после закрытия окна
      // Убрать все отключенные ссылки на скачивание файлов
      modal.on('hidden.bs.modal', function () {
        $(this).find('[data-link-type="download"]').each(function () {
          $(this).parent().removeClass('disabled');
        });
      });
    });
  }

});