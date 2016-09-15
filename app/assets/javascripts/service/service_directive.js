app.directive('modalShow', ['$parse', function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var showModal = function (visible) {
        //console.log(attrs);
        if (visible)
          $(element).modal('show');
        else
          $(element).modal('hide');
      };

      scope.$watch(attrs.modalShow, function (newValue, oldValue) {
        showModal(newValue);
      });

      $(element).on('hide.bs.modal', function () {
        $parse(attrs.modalShow).assign(scope, false);
        if (!scope.$$phase && !scope.$root.$$phase)
          scope.$apply();
      });
    }
  };
}]);