(function() {
  app
    .controller('FlashMessageCtrl', ['$scope', '$attrs', 'Flash', FlashMessageCtrl]);

  function FlashMessageCtrl($scope, $attrs, Flash) {
    $scope.flash = Flash.flash;

    if ($attrs.notice)
      Flash.notice($attrs.notice);

    if ($attrs.alert)
      Flash.alert($attrs.alert);

    $scope.disableAlert = function () {
      Flash.alert(null);
    };
  }

})();