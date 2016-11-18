app.controller('LoginCtl', ['$scope', '$state', '$log', '$stateParams','authService', '$confirm','notificationService','usSpinnerService',
 function($scope, $state, $log, $stateParams, authService, $confirm, notificationService, usSpinnerService) {
  $scope.loginData = {
    userName: '',
    password: ''
  };

  authService.logout();
  $scope.login = function() {
    authService.logout();

    authService.login($scope.loginData).then(function(response) {
        notificationService.success("登录成功");
        $state.go('app.dashboard');
    },
    function (err) {
        notificationService.error(err.error_description);
        $log.error(err);
    });
  };
}]);
