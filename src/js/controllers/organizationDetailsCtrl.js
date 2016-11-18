app.controller('OrganizationDetailsCtrl', ['$rootScope', '$scope', '$stateParams', function ($rootScope, $scope, $stateParams) {
    $scope.name = $stateParams.name;
}]);

app.controller('OrganizationDetailsCtrl1', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', '$q', 'organizationService', 'notificationService', function ($rootScope, $scope, $modal, $log, $stateParams, $q, organizationService, notificationService) {

    $scope.id = $stateParams.guid;

    // organizations
    $scope.quotaDefID = 0;
    $scope.usedQuotaPercent = 0.0;
    $scope.organization = {};
    $scope.quota = {};
    $scope.initialquota = {};

    $scope.currentUser = {
        name: localStorage.getItem('userName'),
        currentManager: false
    };

    var defer1 = $q.defer();
    //get instance usage
    $scope.getInstanceUsage = function () {
        organizationService.getInstanceUsage($scope.id).then(function (response) {
            $scope.instance_usage = response.data.instance_usage;
            defer1.resolve();
        }, function (err) {
            $log.error(err);
            defer1.reject();
        });
        return defer1.promise;
    };


    var defer2 = $q.defer();
    //get memory usage
    $scope.getMemoryUsage = function () {
        organizationService.getMemoryUsage($scope.id).then(function (response) {
            $scope.memory_usage_in_mb = response.data.memory_usage_in_mb;
            defer2.resolve();
        }, function (err) {
            $log.error(err);
            defer2.reject();
        });
        return defer2.promise;
    };

    var defer3 = $q.defer();
    // get particular organization
    $scope.getOrganization = function () {
        organizationService.getOrganization($scope.id).then(function (response) {
            var data = response.data;
            $scope.initialquota.name = $scope.organization.name = data.entity.name;
            $scope.quotaDefID = data.entity.quota_definition_guid;
            defer3.resolve($scope.quotaDefID);
        }, function (err) {
            defer3.reject();
            $log.error(err);
            if (err.data.code)
                notificationService.error('获取组织信息失败:' + err.data.description);
        });
        return defer3.promise;
    };

    // get organization quota
    $scope.getQuotaForTheOrganization = function () {
        organizationService.getQuotaForTheOrganization($scope.quotaDefID).then(function (response) {
            var data = response.data;

            if ($scope.quotaDefID === data.metadata.guid) {
                $scope.quota.guid = $scope.quotaDefID;
                $scope.initialquota.memory_limit = $scope.quota.memory_limit = data.entity.memory_limit;
                $scope.initialquota.total_services = $scope.quota.total_services = data.entity.total_services;
                $scope.initialquota.total_routes = $scope.quota.total_routes = data.entity.total_routes;
                $scope.initialquota.app_instance_limit = $scope.quota.app_instance_limit = data.entity.app_instance_limit;
                $scope.initialquota.total_private_domains = $scope.quota.total_private_domains = data.entity.total_private_domains;
                $scope.initialquota.instance_memory_limit = $scope.quota.instance_memory_limit = data.entity.instance_memory_limit;
            }

            if ($scope.quota.memory_limit > 0) {
                $scope.sumMemRate = (Math.round(($scope.memory_usage_in_mb / $scope.quota.memory_limit) * 10000)/100).toFixed(2);
            } else {
                $scope.sumMemRate = 0;
            }

            if ($scope.quota.app_instance_limit > 0) {
                $scope.sumInstanceRate = (Math.round(($scope.instance_usage / $scope.quota.app_instance_limit) * 10000)/100).toFixed(2);
            } else {
                $scope.sumInstanceRate = 0;
            }

            organizationService.getSpaceSummaryForTheOrganization($scope.id).then(function(response){
                var data = response.data.spaces;
                var actual = 0;
                angular.forEach(data, function (space, i) {
                    actual = space.service_count + actual;
                })
                if($scope.quota.total_services>0)
                    $scope.sumServiceRate =(Math.round((actual / $scope.quota.total_services) * 10000)/100).toFixed(2);
                else
                    $scope.sumServiceRate = 0;
            },function (err) {
                    $log.error(err);
                })

            organizationService.getPrivateDomainsForTheOrganization($scope.id).then(function (response) {
                var actual = response.data.resources.length;
                if($scope.quota.total_private_domains>0)
                    $scope.sumDomainRate =(Math.round((actual / $scope.quota.total_private_domains) * 10000)/100).toFixed(2);
                else
                    $scope.sumDomainRate = 0;
            },function (err) {
                $log.error(err);
            });

        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error('获取组织配额信息失败:' + err.data.description);
        });
    };

    $q.all([$scope.getOrganization(),$scope.getInstanceUsage(), $scope.getMemoryUsage()]).then(function () {
        $scope.getQuotaForTheOrganization();
    });


    $scope.updateQuotaForOrganization = function () {
        var organization = {
            id: $scope.id,
            name: $scope.organization.name
        };
        organizationService.editOrganization(organization);
        organizationService.editQuotaForOrganization($scope.quota).then(function (response) {
            notificationService.success('修改组织' + $scope.organization.name + '成功');
        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error(err);
        });

    };

    $scope.reset = function () {
        $scope.organization.name = $scope.initialquota.name;
        $scope.quota.memory_limit = $scope.initialquota.memory_limit;
        $scope.quota.total_services = $scope.initialquota.total_services;
        $scope.quota.total_routes = $scope.initialquota.total_routes;
        $scope.quota.app_instance_limit = $scope.initialquota.app_instance_limit;
        $scope.quota.total_private_domains = $scope.initialquota.total_private_domains;
        $scope.quota.instance_memory_limit = $scope.initialquota.instance_memory_limit;
    }

}]);

app.controller('OrganizationDetailsCtrl2', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', '$confirm','$q', 'organizationService', 'spaceService', 'i18nService', 'notificationService', function ($rootScope, $scope, $modal, $log, $stateParams, $confirm,$q, organizationService, spaceService, i18nService, notificationService) {

    $scope.id = $stateParams.guid;
    $scope.name = $stateParams.name;
    i18nService.setCurrentLang("zh-cn");

    // space info
    $scope.spaces = [];

    $scope.nrOfSpaces = 0;
    $scope.spacesTotalQuota = 0;

    $scope.currentUser = {
        name: localStorage.getItem('userName'),
        currentManager: false
    };

    // get spaces for the organization
    $scope.getSpacesForTheOrganization = function () {
        $scope.spacelist = [];
        organizationService.getSpacesForTheOrganization($scope.id).then(function (response) {
            var data = response.data;
            // get summary for each space
            angular.forEach(data.resources, function (space, key) {
                $scope.spaces.push(space.metadata.guid);
                var spaceitem = {
                    id: space.metadata.guid,
                    name: space.entity.name,
                    created_at: space.metadata.created_at,
                    updated_at: space.metadata.updated_at,
                    quotaDefID: space.entity.space_quota_definition_guid
                };

                spaceService.getSpaceSummary(space.metadata.guid).then(function (responseSpace) {
                    var dataSpace = responseSpace.data;

                    // calculate space memory and stopped or started apps
                    var memory = 0;
                    var nrOfStartedApps = 0;
                    var nrOfStoppedApps = 0;
                    var nrOfCrashedApps = 0;
                    angular.forEach(dataSpace.apps, function (application, i) {
                        memory += application.memory * application.instances;

                        // started apps
                        if (application.state === 'STARTED') {
                            if ((application.instances - application.running_instances) > 0) {
                                nrOfCrashedApps++;
                            } else {
                                nrOfStartedApps++;
                            }
                        }

                        // stopped apps
                        if (application.state === 'STOPPED') {
                            nrOfStoppedApps++;
                        }

                    });

                    spaceitem.memory = memory;
                    spaceitem.nrOfStartedApps = nrOfStartedApps;
                    spaceitem.nrOfStoppedApps = nrOfStoppedApps;
                    spaceitem.nrOfCrashedApps = nrOfCrashedApps;
                    spaceitem.nrOfServices = dataSpace.services.length;

                    $scope.spacelist.push(spaceitem);

                }, function (err) {
                    $log.error(err);
                });
            });
        }, function (err) {
            $log.error(err);
        });
    };
    $scope.getSpacesForTheOrganization();

    $scope.spaceGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.spacelist
    };

    $scope.$watch('filter.filterSpace', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.spaceGridOptions.data = $scope.spacelist.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterSpace) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);

    var linkCellTemplate = '<div>' +
        '  <a ui-sref="app.space_manage.detail({guid:row.entity.id,spacename:row.entity.name})">{{COL_FIELD}}</a>' +
        '</div>';

    $scope.spaceGridOptions.columnDefs = [
        {name: 'id', displayName: 'ID', visible: false},
        {name: 'name', displayName: '空间名称', cellTemplate: linkCellTemplate},
        {name: 'memory', displayName: '已用内存(M)'},
        {name: 'nrOfServices', displayName: '服务数'},
        {name: 'nrOfStartedApps', displayName: '运行应用'},
        {name: 'nrOfStoppedApps', displayName: '停止应用'},
        {name: 'nrOfCrashedApps', displayName: '崩溃应用'},
        {name: 'created_at', displayName: '创建时间'},
        {name: 'updated_at', displayName: '更新时间'}
    ];

    $scope.spaceGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.createSpace = function () {
        var organization = {
            id: $scope.id,
            guid: $scope.id,
            name: $scope.name
        };

        var modalInstance = $modal.open({
            templateUrl: 'tpl/app_space_create.html',
            controller: 'SpaceCreateInstanceCtrl',
            resolve: {
                deps: ['$ocLazyLoad',
                    function ($ocLazyLoad) {
                        return $ocLazyLoad.load(['js/controllers/spaceAddCtrl.js']);
                    }],
                organization: function () {
                    return organization;
                }
            }
        });

        modalInstance.result.then(function (flag) {
            if (flag)
                $scope.refresh();
        }, function () {

        });
    }

    $scope.deleteSpace = function () {
        if ($scope.gridApi.selection.getSelectedRows().length < 1)
            notificationService.info('请选择一条记录');
        else {
            $confirm({
                text: '请确认是否删除选择的' + $scope.gridApi.selection.getSelectedRows().length + '个空间',
                title: "确认删除",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                var promises = [];
                angular.forEach($scope.gridApi.selection.getSelectedRows(), function (space, i) {
                    promises.push($scope.delete(space));
                });
                $q.all(promises).then(function () {
                    $scope.refresh();
                })
            });
        }
    };

    $scope.delete = function (space) {
        var defer = $q.defer();
        spaceService.deleteSpace(space.id).then(function (response) {
            notificationService.info('删除空间' + space.name + '成功!');
            spaceService.deleteSpaceQuota(space.quotaDefID);
            defer.resolve();
        }, function (err) {
            defer.reject();
            $log.error(err);
            if (err.data.code)
                notificationService.info('删除空间' + space.name + '失败:' + err.data.description);
        });
        return defer.promise;
    }

    $scope.refresh = function () {
        $scope.getSpacesForTheOrganization();
        $scope.spaceGridOptions.data = $scope.spacelist;
        $scope.gridApi.core.refresh();
    };

}]);

app.controller('OrganizationDetailsCtrl3', ['$scope', function ($scope) {
    $scope.$on("DomainUnbindEvent",
        function (event, msg) {
            $scope.$broadcast("DomainUnbindEventFromParent", msg);
        });
    $scope.$on("DomainBindEvent",
        function (event, msg) {
            $scope.$broadcast("DomainBindEventFromParent", msg);
        });

}]);

app.controller('BindedDomainCtrl', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', '$confirm', 'organizationService', 'i18nService', 'notificationService', function ($rootScope, $scope, $modal, $log, $stateParams, $confirm, organizationService, i18nService, notificationService) {
    $scope.id = $stateParams.guid;
    i18nService.setCurrentLang("zh-cn");

    $scope.getDomains = function () {
        $scope.domains = [];
        // get organization privateDomains
        organizationService.getPrivateDomainsForTheOrganization($scope.id).then(function (response) {
            var data = response.data;
            $scope.privateDomains = data.resources;
            angular.forEach(data.resources, function (domain, i) {
                var privateDomainObject = {
                    id: domain.metadata.guid,
                    name: domain.entity.name,
                    created_at: domain.metadata.created_at,
                    updated_at: domain.metadata.updated_at
                };
                $scope.domains.push(privateDomainObject);
            });
            organizationService.setPrivateDomains($scope.domains);
        }, function (err) {
            $log.error(err);
        });
        // Array.prototype.push.apply($scope.domains,organizationService.getPrivateDomains());
    };
    $scope.getDomains();

    $scope.domainGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.domains
    };

    $scope.$watch('filter.filterDomain', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.domainGridOptions.data = $scope.domains.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterDomain) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);


    var linkCellTemplate = '<button  class="btn btn-sm btn-danger" ng-click="grid.appScope.remove(row.entity)">解除绑定</button>';

    $scope.domainGridOptions.columnDefs = [
        {name: 'id', displayName: 'ID', visible: false},
        {name: 'owningOrganizationId', displayName: 'owningOrganizationId', visible: false},
        {name: 'name', displayName: '域名'},
        {name: 'created_at', displayName: '创建时间'},
        {name: 'updated_at', displayName: '绑定操作', cellTemplate: linkCellTemplate, enableSorting: false, width: '80'}
    ];

    $scope.domainGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.remove = function (obj) {
        obj.organizationId = $scope.id;
        if (obj.owningOrganizationId == $scope.id) {
            $confirm({
                text: obj.name + '属于当前组织,无法解除绑定,将会被直接删除!',
                title: "确认删除",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                organizationService.deletePrivateDomains(obj.owningOrganizationId, obj.id).then(function (response) {
                    notificationService.info(obj.name + '已删除');
                    $scope.refresh();
                }, function (err) {
                    $log.error(err);
                    if (err.data.code)
                        notificationService.error(obj.name + '删除失败,原因是:' + err.data.description);
                });

            });
        } else {
            $confirm({
                text: '域名' + obj.name + '将会解除绑定',
                title: "确认解除绑定",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                organizationService.disassociateDomainWithOrganization(obj).then(function (response) {
                    notificationService.info(obj.name + '已解除绑定');
                    $scope.$emit("DomainUnbindEvent", obj.name);
                    $scope.refresh();
                }, function (err) {
                    $log.error(err);
                    if (err.data.code)
                        notificationService.error(obj.name + '解绑失败,原因是:' + err.data.description);
                });

            });
        }

    };

    $scope.$on("DomainBindEventFromParent",
        function (event, msg) {
            console.log(msg + "已被绑定");
            $scope.refresh();
        });

    $scope.refresh = function () {
        $scope.getDomains();
        $scope.domainGridOptions.data = $scope.domains;
        // $scope.gridApi.core.refresh();
    };

}]);

app.controller('UnbindedDomainCtrl', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', 'organizationService', 'i18nService', 'notificationService', function ($rootScope, $scope, $modal, $log, $stateParams, organizationService, i18nService, notificationService) {
    $scope.id = $stateParams.guid;
    i18nService.setCurrentLang("zh-cn");

    $scope.getDomains = function () {
        $scope.domains = [];
        // get all privateDomains
        organizationService.getAllPrivateDomains().then(function (response) {
            var data = response.data;
            var allDomains = [];
            angular.forEach(data.resources, function (domain, i) {
                if (domain.entity.owning_organization_guid.indexOf($scope.id) < 0) {
                    var privateDomainObject = {
                        id: domain.metadata.guid,
                        name: domain.entity.name,
                        created_at: domain.metadata.created_at,
                        updated_at: domain.metadata.updated_at
                    };
                    allDomains.push(privateDomainObject);
                }
            });
            organizationService.getPrivateDomainsForTheOrganization($scope.id).then(function (response) {
                var bindedDomains = [];
                var data = response.data;
                angular.forEach(data.resources, function (domain, i) {
                    var privateDomainObject = {
                        id: domain.metadata.guid,
                        name: domain.entity.name,
                        created_at: domain.metadata.created_at,
                        updated_at: domain.metadata.updated_at
                    };
                    bindedDomains.push(privateDomainObject);
                });
                // organizationService.setPrivateDomains(bindedDomains);
                Array.prototype.push.apply($scope.domains, organizationService.objArrayMins(allDomains, bindedDomains, 'id'));
            }, function (err) {
                $log.error(err);
            });

        }, function (err) {
            $log.error(err);
        });
    };
    $scope.getDomains();

    $scope.domainGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.domains
    };

    $scope.$watch('filter.filterDomain', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.domainGridOptions.data = $scope.domains.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterDomain) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);

    var linkCellTemplate = '<button  class="btn btn-sm btn-info" ng-click="grid.appScope.bind(row.entity)">绑定</button>';
    $scope.domainGridOptions.columnDefs = [
        {name: 'id', displayName: 'ID', visible: false},
        {name: 'owningOrganizationId', displayName: 'owningOrganizationId', visible: false},
        {name: 'name', displayName: '域名'},
        {name: 'created_at', displayName: '创建时间'},
        {name: 'updated_at', displayName: '绑定操作', cellTemplate: linkCellTemplate, enableSorting: false, width: '80'}
    ];

    $scope.domainGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.$on("DomainUnbindEventFromParent",
        function (event, msg) {
            console.log(msg + "已被解绑");
            $scope.refresh();
        });

    $scope.refresh = function () {
        $scope.getDomains();
        $scope.domainGridOptions.data = $scope.domains;
        // $scope.gridApi.core.refresh();
    };

    $scope.bind = function (row) {
        var obj = {
            id: row.id,
            name: row.name,
            organizationId: $scope.id
        };
        organizationService.associateDomainWithOrganization(obj).then(function (response) {
            notificationService.info(obj.name + '已经绑定');
            $scope.refresh();
            $scope.$emit("DomainBindEvent", obj.name);
        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error(obj.name + '绑定失败,原因是:' + err.data.description);
        });
    };

}]);

app.controller('OrganizationDetailsCtrl4', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', 'organizationService', 'i18nService', 'notificationService', function ($rootScope, $scope, $modal, $log, $stateParams, organizationService, i18nService, notificationService) {
    $scope.id = $stateParams.guid;
    i18nService.setCurrentLang("zh-cn");

    $scope.getDomains = function () {
        $scope.domains = [];

        // get organization sharedDomains
        organizationService.getSharedDomainsForTheOrganization($scope.id).then(function (response) {
            var data = response.data;
            $scope.sharedDomains = (data.resources);
            angular.forEach(data.resources, function (sharedDomain, i) {
                var sharedDomainObject = {
                    id: sharedDomain.metadata.guid,
                    name: sharedDomain.entity.name,
                    created_at: sharedDomain.metadata.created_at,
                    updated_at: sharedDomain.metadata.updated_at
                };
                $scope.domains.push(sharedDomainObject);
            });
        }, function (err) {
            $log.error(err);
        });
    };
    $scope.getDomains();

    $scope.domainGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.domains
    };

    $scope.$watch('filter.filterDomain', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.domainGridOptions.data = $scope.domains.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterDomain) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);


    $scope.domainGridOptions.columnDefs = [
        {name: 'id', displayName: 'ID', visible: false},
        {name: 'name', displayName: '域名'},
        {name: 'created_at', displayName: '创建时间'},
        {name: 'updated_at', displayName: '更新时间'}
    ];

    $scope.domainGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.refresh = function () {
        $scope.getDomains();
        $scope.domainGridOptions.data = $scope.domains;
        $scope.gridApi.core.refresh();
    };

}]);

app.controller('OrganizationDetailsCtrl5', ['$scope', function ($scope) {
    var i = 0;
    $scope.$on("UserUnbindEvent",
        function (event, msg) {
            i++;
            if (msg.expect == i) {
                $scope.$broadcast("UserUnbindEventFromParent", msg);
                i = 0;
            }
        });

    var j = 0;
    $scope.$on("UserBindEvent",
        function (event, msg) {
            j++;
            if (msg.expect == j) {
                $scope.$broadcast("UserBindEventFromParent", msg);
                j = 0;
            }
        });

}]);

app.controller('BindedUserCtrl', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', 'organizationService', 'userService', 'i18nService', 'notificationService', 'dialogs', function ($rootScope, $scope, $modal, $log, $stateParams, organizationService, userService, i18nService, notificationService, dialogs) {
    $scope.id = $stateParams.guid;
    i18nService.setCurrentLang("zh-cn");
    $scope.currentUser = {
        name: localStorage.getItem('userName'),
        currentManager: false
    };

    $scope.retrieveRolesOfAllUsersForTheOrganization = function () {
        $scope.users = [];

        organizationService.retrieveRolesOfAllUsersForTheOrganization($scope.id).then(function (response) {
            var data = response.data;

            angular.forEach(data.resources, function (user, key) {

                var orgManager = false;
                var orgAuditor = false;
                var billingManager = false;
                var rolelist = [];
                var userRoles = [];

                angular.forEach(user.entity.organization_roles, function (userRole, key) {

                    var objectRole = {
                        role: userRole
                    };

                    if (userRole === 'org_manager') {
                        orgManager = true;
                        rolelist.push('管理员');
                        objectRole.label = '管理员';

                    }
                    if (userRole === 'billing_manager') {
                        orgAuditor = true;
                        rolelist.push('计费员');
                        objectRole.label = '计费员';
                    }
                    if (userRole === 'org_auditor') {
                        billingManager = true;
                        rolelist.push('审计员');
                        objectRole.label = '审计员';
                    }
                    if (userRole === 'org_user') {
                        billingManager = true;
                        rolelist.push('普通用户');
                        objectRole.label = '普通用户';
                    }

                    userRoles.push(objectRole);

                });

                var objectUser = {
                    id: user.metadata.guid,
                    organizationId: $scope.id,
                    name: user.entity.username,
                    userRoles: rolelist.join(','),
                    roleMaps: userRoles,
                    orgManager: orgManager,
                    orgAuditor: orgAuditor,
                    billingManager: billingManager,
                    currentUser: $scope.currentUser.name === user.entity.username
                };
                $scope.users.push(objectUser);

                if ($scope.currentUser.name === user.entity.username) {
                    $scope.currentUser.currentManager = orgManager;
                }

            });
        }, function (err) {
            $log.error(err);
        });

    };
    $scope.retrieveRolesOfAllUsersForTheOrganization();

    $scope.bindedUserGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.users
    };

    $scope.$watch('filter.filterBindedUser', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.bindedUserGridOptions.data = $scope.users.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterBindedUser) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);

    $scope.$on("UserBindEventFromParent",
        function (event, msg) {
            $scope.refresh();
        });
    $scope.$on("UserUnbindEventFromParent",
        function (event, msg) {
            $scope.refresh();
        });

    var linkCellTemplate = '<button  class="btn btn-sm btn-danger" ng-click="grid.appScope.unbind(row.entity)">解除绑定</button>';

    $scope.bindedUserGridOptions.columnDefs = [
        {name: 'organizationId', displayName: 'organizationId', visible: false},
        {name: 'name', displayName: '用户名'},
        {name: 'userRoles', displayName: '角色'},
        {name: 'roleMaps', visible: false},
        {name: 'id', displayName: '绑定操作', cellTemplate: linkCellTemplate, width: 80, enableSorting: false}
    ];

    $scope.refresh = function () {
        $scope.retrieveRolesOfAllUsersForTheOrganization();
        $scope.bindedUserGridOptions.data = $scope.users;
    };

    $scope.unbind = function (obj) {

        var dlg = dialogs.create('tpl/app_org_usr_unbind.html', 'UnbindDialogCtrl', obj, 'default');
        dlg.result.then(function (roles) {
            var callInfo = {
                expect: roles.length
            };
            angular.forEach(roles, function (role, i) {
                callInfo.actual = i + 1;

                if (role == 'org_manager') {
                    organizationService.disassociateManagerWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        notificationService.info('管理员解绑成功');
                    }, function (err) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('管理员解绑失败:' + err.data.description);
                    });
                }
                if (role == 'org_auditor') {
                    organizationService.disassociateAuditorWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        notificationService.info('审计员解绑成功');
                    }, function (err) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('审计员解绑失败:' + err.data.description);
                    });
                }
                if (role == 'billing_manager') {
                    organizationService.disassociateBillingManagerWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        notificationService.info('计费员解绑成功');
                    }, function (err) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('计费员解绑失败:' + err.data.description);
                    });
                }
                if (role == 'org_user') {
                    organizationService.disassociateUserWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        notificationService.info('普通用户解绑成功');
                    }, function (err) {
                        $scope.$emit("UserUnbindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('普通用户解绑失败:' + err.data.description);
                    });
                }
            });
        }, function () {
            notificationService.info('未作任何变更');
        });
    };

}]);

app.controller('UnbindDialogCtrl', ['$scope', '$modalInstance', '$confirm', 'organizationService', 'data', function ($scope, $modalInstance, $confirm, organizationService, data) {
    $scope.data = data;

    $scope.ok = function () {
        $confirm({
            text: '请确认解除角色绑定:' + $scope.selectedTags.join(','),
            title: "解除绑定",
            ok: "确认",
            cancel: '取消'
        }).then(function () {
            if ($scope.selected.length > 0)
                $modalInstance.close($scope.selected);
            else
                $modalInstance.dismiss('cancel');
        });

    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.selected = [];
    $scope.selectedTags = [];

    var updateSelected = function (action, id, name) {
        if (action == 'add' && $scope.selected.indexOf(id) == -1) {
            $scope.selected.push(id);
            $scope.selectedTags.push(name);
        }
        if (action == 'remove' && $scope.selected.indexOf(id) != -1) {
            var idx = $scope.selected.indexOf(id);
            $scope.selected.splice(idx, 1);
            $scope.selectedTags.splice(idx, 1);
        }
    }

    $scope.updateSelection = function ($event, id) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        updateSelected(action, id, checkbox.name);
    }

    $scope.isSelected = function (id) {
        return $scope.selected.indexOf(id) >= 0;
    }

}]);

app.controller('UnbindedUserCtrl', ['$rootScope', '$scope', '$modal', '$log', '$stateParams', '$q', 'organizationService', 'userService', 'i18nService', 'notificationService', 'dialogs', function ($rootScope, $scope, $modal, $log, $stateParams, $q, organizationService, userService, i18nService, notificationService, dialogs) {
    $scope.id = $stateParams.guid;
    i18nService.setCurrentLang("zh-cn");
    $scope.currentUser = {
        name: localStorage.getItem('userName'),
        currentManager: false
    };

    $scope.getUnBindedUsers = function () {
        $scope.users = [];

        userService.getUsers().then(function (response) {
            var data = response.data;
            angular.forEach(data.resources, function (user, i) {
                var unbindeduser = {
                    id: user.metadata.guid,
                    name: user.entity.username,
                    organizationId: $scope.id
                };
                if (unbindeduser.id && unbindeduser.name)
                    $scope.users.push(unbindeduser);
            });
        }, function (err) {
            $log.error(err);
        });

    };
    $scope.getUnBindedUsers();

    $scope.unBindedUserGridOptions = {
        enablePaginationControls: true,
        enableScrollbars: false,
        paginationPageSize: 10,
        paginationPageSizes: [10, 20, 50, 100],
        enableSelectAll: false,
        multiSelect: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: false,
        i18n: 'zh-cn',
        data: $scope.users
    };

    $scope.$watch('filter.filterUnBindedUser', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.unBindedUserGridOptions.data = $scope.users.filter(function (data) {
            if (data.name.toLowerCase().indexOf($scope.filter.filterUnBindedUser) > -1) {
                return true;
            }
            else {
                return false;
            }
        });

    }, true);

    var linkCellTemplate = '<button  class="btn btn-sm btn-info" ng-click="grid.appScope.bind(row.entity)">绑定</button>';

    $scope.unBindedUserGridOptions.columnDefs = [
        {name: 'organizationId', visible: false},
        {name: 'name', displayName: '用户名'},
        {name: 'id', displayName: '绑定操作', cellTemplate: linkCellTemplate, width: 80, enableSorting: false}
    ];

    $scope.refresh = function () {
        $scope.getUnBindedUsers();
        $scope.unBindedUserGridOptions.data = $scope.users;
    };

    $scope.bind = function (obj) {

        var dlg = dialogs.create('tpl/app_org_usr_bind.html', 'BindDialogCtrl', obj, 'default');
        dlg.result.then(function (roles) {
            var callInfo = {
                expect: roles.length
            };
            angular.forEach(roles, function (role, i) {
                callInfo.actual = i + 1;

                if (role == 'org_manager') {
                    organizationService.associateManagerWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserBindEvent", callInfo);
                        notificationService.info('绑定管理员成功');
                    }, function (err) {
                        $log.error(err);
                        $scope.$emit("UserBindEvent", callInfo);
                        if (err.data.code)
                            notificationService.error('绑定管理员失败:' + err.data.description);
                    });
                }
                if (role == 'org_auditor') {
                    organizationService.associateAuditorWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserBindEvent", callInfo);
                        notificationService.info('绑定审计员成功');
                    }, function (err) {
                        $scope.$emit("UserBindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('绑定审计员失败:' + err.data.description);
                    });
                }
                if (role == 'billing_manager') {
                    organizationService.associateBillingManagerWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserBindEvent", callInfo);
                        notificationService.info('绑定计费员成功');
                    }, function (err) {
                        $scope.$emit("UserBindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('绑定计费员失败:' + err.data.description);
                    });
                }
                if (role == 'org_user') {
                    organizationService.associateUserWithOrganization(obj).then(function (response) {
                        $scope.$emit("UserBindEvent", callInfo);
                        notificationService.info('绑定普通用户成功');
                    }, function (err) {
                        $scope.$emit("UserBindEvent", callInfo);
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('绑定普通用户失败:' + err.data.description);
                    });
                }
            });
        }, function () {
            notificationService.info('未作任何变更');
        });
    };

}]);

app.controller('BindDialogCtrl', ['$scope', '$modalInstance', '$confirm', '$log', '$q', 'organizationService', 'userService', 'notificationService', 'data', function ($scope, $modalInstance, $confirm, $log, $q, organizationService, userService, notificationService, data) {
    $scope.data = data;

    userService.getUserSummary($scope.data.id).then(function (response) {
        $scope.roles = [];
        var result = response.data;

        if (result.entity.organizations) {
            var flag = false;
            angular.forEach(result.entity.organizations, function (org, i) {
                if (data.organizationId == org.metadata.guid) {
                    flag = true;
                }
            });
            if (!flag) {
                var roleMap = {
                    label: '普通用户',
                    role: 'org_user'
                };
                $scope.roles.push(roleMap);
            }
        }
        if (result.entity.managed_organizations) {
            var flag = false;
            angular.forEach(result.entity.managed_organizations, function (org, i) {
                if (data.organizationId == org.metadata.guid) {
                    flag = true;
                }
            });
            if (!flag) {
                var roleMap = {
                    label: '管理员',
                    role: 'org_manager'
                };
                $scope.roles.push(roleMap);
            }
        }
        if (result.entity.billing_managed_organizations) {
            var flag = false;
            angular.forEach(result.entity.billing_managed_organizations, function (org, i) {
                if (data.organizationId == org.metadata.guid) {
                    flag = true;
                }
            });
            if (!flag) {
                var roleMap = {
                    label: '计费员',
                    role: 'billing_manager'
                };
                $scope.roles.push(roleMap);
            }
        }
        if (result.entity.audited_organizations) {
            var flag = false;
            angular.forEach(result.entity.audited_organizations, function (org, i) {
                if (data.organizationId == org.metadata.guid) {
                    flag = true;
                }
            });
            if (!flag) {
                var roleMap = {
                    label: '审计员',
                    role: 'org_auditor'
                };
                $scope.roles.push(roleMap);
            }
        }

    }, function (err) {
        $log.error(err);
    });

    $scope.ok = function () {
        if ($scope.roles.length < 1) {
            $modalInstance.dismiss('cancel');
        } else {
            $confirm({
                text: '请确认绑定角色:' + $scope.selectedTags.join(','),
                title: "确认绑定",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                if ($scope.selected.length > 0) {
                    $modalInstance.close($scope.selected);
                }
                else
                    $modalInstance.dismiss('cancel');
            });
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.selected = [];
    $scope.selectedTags = [];

    var updateSelected = function (action, id, name) {
        if (action == 'add' && $scope.selected.indexOf(id) == -1) {
            $scope.selected.push(id);
            $scope.selectedTags.push(name);
        }
        if (action == 'remove' && $scope.selected.indexOf(id) != -1) {
            var idx = $scope.selected.indexOf(id);
            $scope.selected.splice(idx, 1);
            $scope.selectedTags.splice(idx, 1);
        }
    }

    $scope.updateSelection = function ($event, id) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        updateSelected(action, id, checkbox.name);
    }

    $scope.isSelected = function (id) {
        return $scope.selected.indexOf(id) >= 0;
    }

}]);
