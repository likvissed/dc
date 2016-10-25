(function() {
  app
    .directive('disableLink', disableLink)
    .directive('modalShow', modalShow)
    .directive('datatableWrapper', datatableWrapper)
    .directive('newRecord', newRecord);

  modalShow.$inject         = ['$parse'];
  datatableWrapper.$inject  = ['$timeout', '$compile'];
  newRecord.$inject         = ['$templateRequest', '$compile', '$parse'];

  // Отключить переход по ссылке
  function disableLink() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var checkLink = function (data) {
          if (data)
            element.on('click', function (event) {
              event.preventDefault();
            });
          else
            element.off().on('click', function() {
              return true;
            })
        };

        scope.$watch(attrs.disableLink, function (newValue, oldValue) {
          checkLink(newValue);
        });
      }
    }
  }

  // Показать/скрыть модальное окно
  function modalShow($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var showModal = function (visible) {
          if (visible)
            $(element).modal('show');
          else
            $(element).modal('hide');
        };

        scope.$watch(attrs.modalShow, function (newValue, oldValue) {
          showModal(newValue);
        });

        // Установить фокус
        $(element).on('shown.bs.modal', function () {
          $(element).find('input, select').first().focus();
        });

        $(element).on('hide.bs.modal', function () {
          $parse(attrs.modalShow).assign(scope, false);
          if (!scope.$$phase && !scope.$root.$$phase)
            scope.$apply();
        });
      }
    };
  }

  // Скомпилировать представление таблиц DataTable
  // Нужно для работы директивы newRecord, так как на момент добавления этой директивы DOM уже скомпилирован
  function datatableWrapper($timeout, $compile) {
    return {
      restrict: 'E',
      transclude: true,
      template: '<ng-transclude></ng-transclude>',
      link: link
    };

    function link(scope, element, attrs) {
      function compileElements() {
        $timeout(function () {
          $compile(element.find('.service-filter'))(scope);
          $compile(element.find('.new-record'))(scope);
        }, 0, false);
      }

      compileElements();

      scope.$watch(
        function (scope) {
          if (scope.servicePage)
            return scope.servicePage.selectedOption
        },
        function () {
          compileElements();
        },
        true
      )
    }
  }

  // Для таблицы DataTable добавить кнопку "Добавить", если у пользователя есть доступ
  // Необходимо добавить в атрибут id имя контроллера, на который отправится запрос
  function newRecord() {
    return {
      restrict: 'C',
      //template: '<button class="btn-sm btn btn-primary btn-block" ng-click="contactPage.showContactModal()">Добавить</button>'
      templateUrl: function (element, attrs) {
        return '/' + attrs.id + '/link/new_record.json';
      }
    }
  }
})();