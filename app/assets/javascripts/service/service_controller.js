app.controller('ServiceEditCtrl', ['$scope', 'Service', 'Test', 'GetServiceData', function ($scope, Service, Test, GetServiceData) {

  // Инициализация начальных данных
  // id - id формуляра
  // name - имя формуляра
  $scope.init = function (id, name) {
    GetServiceData.ajax(id, name).then(function (data) {
      var service = new Test(id, name, data);

      $scope.networks       = service.getNetworks();      // ПРОВЕРИЛ. НУЖНО. Массив с подключениями к сети
      $scope.missing_file   = service.getMissingFiles();  // ПРОВЕРИЛ. НУЖНО. Массив с отстствующими флагами
      $scope.parents        = service.getParents();       // ПРОВЕРИЛ. НУЖНО. Массив с сервисами-родителями
      $scope.storages       = service.getStorages();      // ПРОВЕРИЛ. НУЖНО. Массив с подключениями к СХД
      $scope.visible_count  = service.visible_count;  // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
      //$scope.serviceForm   = attrs.serviceForm;      // Переменная, хранящее id сервиса (если существует) или 0 (если нет)
      $scope.current_name   = name ? name : null;         // ПРОВЕРИЛ. НУЖНО. current_name необходим для исключения этого имени из списка родителей-сервисов

      $scope.services       = service.services; // ПРОВЕРИЛ. НУЖНО.
      console.log($scope.services);

    });
  };

  $scope.addParent = function () {
    $scope.parents = service.addParent();
    console.log($scope.parents);
  };

  // Добавить сервис-родитель
  /*$scope.addParent = function () {
    // Провера на количество сервисов (нельзя создать зависимость, если количество сервисов = 1)
    if ($scope.services.length == 1 && $scope.serviceForm != 0) { // Если формуляр единственный и он редактируется
      alert('Для создания зависимостей необходимо добавить больше сервисов');
      return false;
    }

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
*/
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