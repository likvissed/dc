app.directive('serviceForm', ['$http', 'Service', function ($http, Service) {
  return function(scope, element, attrs) {
    //scope.networks      = Service.setNetworks();  // Массив с подключениями к сети
    //scope.missing_file  = Service.missing_file;   // Массив с флагами, определяющими наличие файлов
    //scope.parents       = Service.parents;        // Массив с сервисами-родителями
    //scope.storages      = Service.setStorages();  // Массив с подключениями к СХД
    //scope.visible_count = Service.visible_count;  // Количество строк "Подключения к сети", видимых пользователем (должно быть минимум 2, так как в формуляре минимум две строки на этот пункт)
    //scope.serviceForm   = attrs.serviceForm;      // Переменная, хранящее id сервиса (если существует) или 0 (если нет)
    //scope.current_name  = null;                   // current_name необходим для исключения этого имени из списка родителей-сервисов

    //  Редактирование существующего сервиса
    /*if (attrs.serviceForm == 0) {
      $http.get('/services/new.json')
        .success(function (data, status, header, config) {
          scope.services = data.services;
        });
    }
    else {
      $http.get('/services/' + attrs.serviceName + '/edit.json')
        .success(function (data, status, header, config) {
          scope.services      = data.services;
          scope.parents       = data.parents; //Массив со списком родительских сервисов (от которых зависит текщий сервис)
          scope.current_name  = data.current_name; // current_name необходим для исключения этого имени из списка родителей-сервисов
          scope.missing_file  = data.missing_file; // Заполнение массива файлов скана, акта, инструкций (если файл отсутствует => true)

          // Настройка полей подключений к сети
          // Для существующего сервиса либо получить количество подключений к сети (если их больше 2), либо установить равным 2
          if (data.service_networks.length > 2)
            scope.visible_count = data.service_networks.length;

          scope.networks = Service.setNetworks(data.service_networks);
          scope.storages = Service.setStorages(data.storage_systems);
        });
    }*/
  }
}]);