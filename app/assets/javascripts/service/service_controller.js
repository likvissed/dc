(function() {
  'use strict';

  app
    .controller('ServiceEditCtrl', ['Service', 'GetServiceData', ServiceEditCtrl])
    .controller('DependenceCtrl', ['Service', DependenceCtrl]);

  function ServiceEditCtrl(Service, GetServiceData) {

    var self = this;

// ================================================ Инициализация ======================================================

    // Для директивы modalShow
    self.flags = Service.getFlags();

    // Инициализация начальных данных
    // id - id формуляра
    // name - имя формуляра
    self.init = function (id, name) {
      GetServiceData.ajax(id, name)
        .then(function (data) {
          Service.init(id, name, data);

          self.network          = Service.getNetworks();      // Массив с подключениями к сети
          self.missing_file     = Service.getMissingFiles();  // Массив с отстствующими флагами
          self.parents          = Service.getParents();       // Массив с сервисами-родителями
          self.storages         = Service.getStorages();      // Массив с подключениями к СХД
          self.current_name     = name ? name : null;         // Необходим для исключения этого имени из списка родителей-сервисов
          self.services         = Service.getServices();      // Массив всех существующих сервисов для выбора сервисов-родителей.
        })
        .then(function () {
          // Фильтр, определяющий, показывать ли надпись "Отсутствует" в поле родителей-сервисов
          self.showParents = function () {
            return Service.showParents();
          };
        });
    };

// ================================================ "Подключения к сети" ===============================================

    // Открыть модальное окно "Подключение к сети"
    self.showNetworkModal = function ($index) {
      Service.setFlag('networkModal', true);

      // Запоминаем индекс строки, данные о которой необходимо изменить
      self.template_network = {
        index: $index,
        value: Service.getNetworkTemplate($index)
      }
    };

    // Добавить строку "Подключения к сети"
    self.addNetwork = function () {
      Service.addNetwork();
    };

    // Закрыть модальное окно по нажатии "Отмена"
    self.closeNetworkModal = function () {
      Service.setFlag('networkModal', false);
      Service.setNetwork(self.template_network.index, self.template_network.value); // Записали новые данные
    };

    // Закрыть модальное окно по нажатии "Готово"
    self.readyNetworkModal = function () {
      Service.setFlag('networkModal', false);
      Service.setNetwork(self.template_network.index, self.template_network.value); // Записали новые данные
    };

    // Удалить строку "Подключения к сети"
    self.delNetwork = function (network) {
      Service.delNetwork(network);
    };


// ================================================ Открытые порты =====================================================

    // Открыть модальное окно "Открытые порты"
    self.showPortsModal = function ($event) {

      self.template_index = 0;
      self.template_value = Service.getCurrentPorts();

      //self.template_ports = {
      //  index:      0, // Индекс выбранного подключения к сети в модальном окне "Открытые порты"
      //  value:      Service.getCurrentPorts() // Массив открытых портов всех подключений к сети текущего формуляра
      //};

      if (self.template_value.length != 0)
        Service.setFlag('portModal', true);
      else {
        $($event.target).blur();
        alert("Необходимо создать \"Подключение к сети\"");
      }
    };

    self.readyPortsModal = function () {
      Service.setFlag('portModal', false);

      //Сохраняем значения массива template_ports в массив подключений к сети (который отправится на сервер)
      Service.setPorts(self.template_value);
    };

    self.closePortsModal = function () {
      Service.setFlag('portModal', false);
    };

    // Фильтр для отображения подключений к сети в модальном окне "Открытые порты"
    self.networksFilter = function () {
      return function (network) {
        return network.value != null;
      }
    };

    // Событие после выбора "Подключения к сети" в модальном окне "Открытые порты"
    self.changeNetwork = function () {
      // Получаем новый индекс массива портов (используется в паршиале _ports в качестве индекса массива template_ports)
      $.each(self.template_value, function (index, value) {
        if (value.local_id == self.network.selected.local_id) {
          self.template_index = index;

          return false;
        }
      });
    };

// ================================================ Работа с файлами ===================================================

    // Удалить файл
    self.removeFile = function ($event) {
      if (!self.missing_file[$event.target.attributes['data-type'].value])
        Service.removeFile($event);
    };
  }

// ================================================ Сервисы-родители ===================================================

  function DependenceCtrl(Service) {

    // Добавить сервис-родитель
    this.addParent = function () {
      Service.addParent();
    };

    // Удалить сервис-родитель
    this.delParent = function (parent) {
      Service.delParent(parent);
    };
  }
})();


