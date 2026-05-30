angular.module('legacyApp', [])
  .controller('MainCtrl', function($scope) {
    $scope.title = 'Legacy AngularJS App';
    $scope.subtitle = 'Demonstrating base-scoped.css + legacy-shim.css migration';

    $scope.transactions = [
      { name: 'Meridian Holdings', date: 'Oct 24', status: 'Completed', amount: '+$450,000', statusType: 'success' },
      { name: 'Apex Construction', date: 'Oct 23', status: 'Pending', amount: '-$82,500', statusType: 'warning' },
      { name: 'Nova Biotech', date: 'Oct 21', status: 'Completed', amount: '+$125,000', statusType: 'success' },
      { name: 'Summit Logistics', date: 'Oct 20', status: 'Pending', amount: '+$38,200', statusType: 'warning' },
    ];

    $scope.themes = ['professional', 'light', 'dark', 'healthcare', 'saas', 'minimal', 'forest', 'ocean'];
    $scope.currentTheme = 'professional';

    $scope.setTheme = function(theme) {
      $scope.currentTheme = theme;
      var link = document.getElementById('theme-link');
      if (link) {
        var base = link.href.replace(/themes\/.*\.css/, 'themes/');
        link.href = base + theme + '.css';
      }
      var html = document.documentElement;
      if (theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };
  });
