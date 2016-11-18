app.controller('SpaceListCtl', [ '$rootScope', '$scope','$stateParams','$log','$q','$confirm','$modal','spaceService','organizationService','i18nService','notificationService','uiGridConstants',
    function($rootScope, $scope,$stateParams,$log,$q,$confirm,$modal,spaceService,organizationService,i18nService,notificationService,uiGridConstants) {
        $scope.organizations = [];
        $scope.spaces = [];
        $scope.spaceappdatas = [];
        $scope.spacedomaindatas = [];

        $scope.organizationName = "未分配";

        $scope.currOrg;


        //get all orgs
        organizationService.getOrganizations().then(function(response) {
            var orgsdata = response.data;
            angular.forEach(orgsdata.resources, function (org, i) {
                var objectOrg = {
                    guid:org.metadata.guid,
                    name: org.entity.name,
                };
                $scope.organizations.push(objectOrg);
            });
        });

        $scope.getSpaces=function(){
            $scope.spaces = [];
            spaceService.getSpaces().then(function(response) {

                var data = response.data;

                angular.forEach(data.resources, function(spaceInfo, i) {


                    organizationService.getOrganization(spaceInfo.entity.organization_guid).then(function(response) {
                        var objectSpace = {
                            guid: spaceInfo.metadata.guid,
                            quotaDefID:spaceInfo.entity.space_quota_definition_guid,
                            url: spaceInfo.metadata.url,
                            name: spaceInfo.entity.name,
                            created_at: spaceInfo.metadata.created_at,
                            updated_at: spaceInfo.metadata.updated_at,
                            org: response.data.entity.name,
                        };
                        $scope.spaces.push(objectSpace);
                    });
                });
                $scope.refresh1();

            }, function (err) {
                messageService.addMessage('danger', 'The organizations have not been loaded.', true);
                $log.error(err);
            });

        }

        $scope.getSpaces();


        $scope.getSpacesForTheOrg=function(selected_org){
            $scope.spaces = [];
            organizationService.getSpacesForTheOrganization(selected_org.guid).then(function(response){
                var spacedata = response.data;
                angular.forEach(spacedata.resources,function(_spacedata){
                    var space={
                        guid: _spacedata.metadata.guid,
                        quotaDefID:_spacedata.entity.space_quota_definition_guid,
                        url: _spacedata.metadata.url,
                        name: _spacedata.entity.name,
                        created_at: _spacedata.metadata.created_at,
                        updated_at: _spacedata.metadata.updated_at,
                        org: selected_org.name,
                    }
                    $scope.spaces.push(space);
                });
                $scope.refresh1();
            });
        };



        //get Space by one org
        $scope.getAppsByOrgParams=function(selected_org){
            $scope.currOrg=selected_org;
            if (selected_org==null){
                $scope.getSpaces();
                return;
            }
            $scope.getSpacesForTheOrg(selected_org);
        };




        i18nService.setCurrentLang("zh-cn");

        $scope.spacegridOptions = {
            data: $scope.spaces,
            enablePaginationControls: true,
            enableScrollbars: false,
            paginationPageSize: 10,
            paginationPageSizes: [10, 20, 50, 100],
            enableSelectAll: false,
            multiSelect: true,
            selectionRowHeaderWidth: 35,
            rowHeight: 35,
            showGridFooter: false,
            i18n: 'zh-cn'
        };


        $scope.$watch('filter.filterText', function (newVal, oldVal) {
            if (newVal == oldVal)
                return;
            $scope.spacegridOptions.data = $scope.spaces.filter(function (data) {
                if (data.name.toLowerCase().indexOf($scope.filter.filterText) > -1) {
                    return true;
                }
                else {
                    return false;
                }
            });

        }, true);

        var linkCellTemplate = '<div>' +
            '  <a ui-sref="app.space_manage.detail({guid:row.entity.guid,spacename:row.entity.name})">{{COL_FIELD}}</a>' +
            '</div>';

        $scope.spacegridOptions.columnDefs = [
            {name: 'guid', displayName: 'ID', visible: false},
            {name: 'name', displayName: '空间名称', cellTemplate: linkCellTemplate},
            {name: 'org', displayName: '所属组织'},
           /* {name: 'space', displayName: '空间'},
            {name: 'instance', displayName: '实例数'},*/
            {name: 'created_at', displayName: '创建时间', sort: {
                direction: uiGridConstants.DESC,
                priority: 1,
            },
            },
            {name: 'updated_at', displayName: '修改时间'}
        ];

        $scope.spacegridOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
        }

        $scope.refresh1= function () {
            $scope.spacegridOptions.data = $scope.spaces;
           /* $scope.gridApi.core.refresh();*/
        };

        $scope.refresh = function () {
            $scope.getSpaces();
        };

        $scope.deletespace = function () {
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
                    angular.forEach($scope.gridApi.selection.getSelectedRows(), function (spaces, i) {
                        promises.push($scope.delete(spaces));
                    });
                    $q.all(promises).then(function () {
                        $scope.refresh();
                    })
                });
            }
        };

        $scope.delete = function (spaces) {
            var defer = $q.defer();
            spaceService.deleteSpace(spaces.guid).then(function (response4)  {
                    notificationService.success('删除空间[' + spaces.name + ']成功');
                    spaceService.deleteSpaceQuota(spaces.quotaDefID);
                    defer.resolve();
            }, function (err, status) {
                defer.reject();
                $log.error(err);
                if (err.data.code)
                    notificationService.error('删除空间[' + spaces.name + ']失败,原因是:\n' + err.data.description);
            });
            return defer.promise;
        }

        $scope.addspace = function () {

            var modalInstance = $modal.open({
                templateUrl: 'tpl/app_space_create.html',
                controller: 'SpaceCreateInstanceCtrl',
                resolve: {
                    deps: ['$ocLazyLoad',
                        function( $ocLazyLoad ){
                            return $ocLazyLoad.load(['js/controllers/spaceAddCtrl.js']);
                        }],
                    organization:function () {
                        return $scope.currOrg;
                    }
                }
            });

            modalInstance.result.then(function (result) {
                if(result)
                    $scope.refresh();
            });

        };

    }]);


app.controller('SpaceListDetail', [ '$rootScope', '$scope','$stateParams','$log','spaceService','organizationService','notificationService',
    function($rootScope, $scope,$stateParams,$log, spaceService,organizationService,notificationService) {

        $scope.organizations = [];
        $scope.spaces = [];
        $scope.spaceName='';
        $scope.spaceappdatas = [];
        $scope.spacedomaindatas = [];

        $scope.isActive = function (option)
        {
            if(option=='s')
            {
                $scope.quota = {
                    "total_services":5,
                    "total_routes":5,
                    "memory_limit":512,
                    "instance_memory_limit":512,
                    "app_instance_limit":5,
                    /* "total_reserved_route_ports":2,*/
                    "total_service_keys":5

                };

            }
            if(option=='m')
            {
                $scope.quota = {
                    "total_services":20,
                    "total_routes":20,
                    "memory_limit":2048,
                    "instance_memory_limit":1024,
                    "app_instance_limit":20,
                    /* "total_reserved_route_ports":5,*/
                    "total_service_keys":20
                };
            }
            if(option=='l')
            {
                $scope.quota = {
                    "total_services":50,
                    "total_routes":50,
                    "total_private_domains":50,
                    "memory_limit":10240,
                    "instance_memory_limit":2048,
                    "app_instance_limit":50,
                    /*"total_reserved_route_ports":10,*/
                    "total_service_keys":50
                };
            }
        };

//get all orgs
        organizationService.getOrganizations().then(function(response) {
            var orgsdata = response.data;
            angular.forEach(orgsdata.resources, function (org, i) {
                var objectOrg = {
                    guid:org.metadata.guid,
                    id: org.metadata.guid,
                    name: org.entity.name,
                };
                $scope.organizations.push(objectOrg);
            });
        });

        spaceService.getApplicationsForTheSpace($stateParams.guid).then(function(response) {
            var data = response.data;
            angular.forEach(data.resources, function(sharedDomain, i){
                var sharedDomainObject = {
                    guid: sharedDomain.metadata.guid,
                    url: sharedDomain.metadata.url,
                    name: sharedDomain.entity.name,
                    state: sharedDomain.entity.state,
                    instances: sharedDomain.entity.instances,
                    created_at: sharedDomain.metadata.created_at,
                    updated_at: sharedDomain.metadata.updated_at,
                };
                $scope.spaceappdatas.push(sharedDomainObject);
            });
        }, function(err) {
            $log.error(err.data.description);
        });

        $scope.getSpace = function(){
            spaceService.getSpace($stateParams.guid).then(function(response) {
                var data = response.data;
                $scope.spaceName = data.entity.name;
                $scope.spaceId = data.metadata.guid;
                $scope.quotaDefID = data.entity.space_quota_definition_guid;
                spaceService.getQuotaForTheSpace($scope.quotaDefID).then(function(response) {
                    var data = response.data;
                    $scope.quota = {
                        "memory_limit":data.entity.memory_limit,
                        "app_instance_limit":data.entity.app_instance_limit,
                        "total_services":data.entity.total_services,
                        "total_routes":data.entity.total_routes
                    }


                    spaceService.getSpaceSummary($stateParams.guid).then(function(response){
                        var data = response.data;
                        var maxService = 0;
                        var maxRoute=0;
                        var sumMem=0;
                        var sumApplication=0;
                        $scope.usedMemoryPercent;
                        $scope.usedApplicationPercent;
                        $scope.usedServicePercent;
                        $scope.usedRoutesPercent;
                        angular.forEach(data.apps,function(_data,i){
                            sumMem = _data.memory+sumMem;
                            sumApplication = _data.instances+sumApplication;
                            maxRoute = _data.routes.length+maxRoute;
                        })
                        maxService = data.services.length;
                        if ($scope.quota.memory_limit > 0) {
                            $scope.usedMemoryPercent = Math.round((sumMem/$scope.quota.memory_limit) * 100);
                        } else {
                            $scope.usedMemoryPercent = 0;
                        }
                        if ($scope.quota.app_instance_limit > 0) {
                            $scope.usedApplicationPercent = Math.round((sumApplication/$scope.quota.app_instance_limit) * 100);
                        } else {
                            $scope.usedApplicationPercent = 0;
                        }
                        if ($scope.quota.total_services > 0) {
                            $scope.usedServicePercent = Math.round((maxService/$scope.quota.total_services) * 100);
                        } else {
                            $scope.usedServicePercent = 0;
                        }
                        if ($scope.quota.total_routes > 0) {
                            $scope.usedRoutesPercent = Math.round((maxRoute/$scope.quota.total_routes) * 100);
                        } else {
                            $scope.usedRoutesPercent = 0;
                        }
                    })


                    /*   $scope.quota.memory_limit =data.entity.memory_limit;
                     $scope.quota.app_instance_limit =data.entity.instance_memory_limit;
                     $scope.quota.total_services =data.entity.total_services;
                     $scope.quota.total_routes =data.entity.total_routes;*/
                }, function(err) {
                    $log.error(err.data.description);
                });
            }, function(err) {
                $log.error(err.data.description);
            });
        }



        //get current org by ssy
        spaceService.getSpace($stateParams.guid).then(function (response) {
            var organization_guid = response.data.entity.organization_guid;
            organizationService.getOrganization(organization_guid).then(function (response) {
                $scope.organizationName = response.data.entity.name;
            });

        });

        $scope.chooseOrg = function(selected_org){
            $scope.organization_guid = selected_org.id;
        }
        //更新
        $scope.update = function () {
            $scope.space = {
                id: $stateParams.guid,
                name: $scope.spaceName,
            };
         /*   var quota = {
                id:$stateParams.guid,
            }*/
            spaceService.editSpace($scope.space).then(function(){
                $scope.quota.guid = $scope.quotaDefID;
                spaceService.editSpaceQuota($scope.quota);
                notificationService.success('修改空间成功');
            }, function (err) {
                $log.error(err);
                if (err.data.code)
                    notificationService.error('修改空间失败,原因是:\n' + err.data.description);
            })

        };



        //$scope.getSpaceInfo = function () {
        //    spaceService.getQuotas().then(function(response){
        //        var data = response.data;
        //        var maxService = 0;
        //        var maxRoute=0;
        //        var sumMem=0;
        //        var sumApplication=0;
        //        $scope.usedMemoryPercent;
        //        $scope.usedApplicationPercent;
        //        $scope.usedServicePercent;
        //        $scope.usedRoutesPercent;
        //        angular.forEach(data.resources,function(_data,i){
        //            sumMem = _data.entity.memory_limit+sumMem;
        //            sumApplication = _data.entity.instance_memory_limit+sumApplication;
        //            maxService = _data.entity.total_services+maxService;
        //            maxRoute = _data.entity.total_routes+maxRoute;
        //        })
        //        if ($scope.quota.memory_limit > 0) {
        //            $scope.usedMemoryPercent = Math.round(($scope.quota.memory_limit / $scope.sumMem) * 100);
        //        } else {
        //            $scope.usedMemoryPercent = 0;
        //        }
        //        if ($scope.quota.app_instance_limit > 0) {
        //            $scope.usedApplicationPercent = Math.round(($scope.quota.app_instance_limit / $scope.sumApplication) * 100);
        //        } else {
        //            $scope.usedApplicationPercent = 0;
        //        }
        //        if ($scope.quota.total_services > 0) {
        //            $scope.usedServicePercent = Math.round(($scope.quota.total_services / $scope.maxService) * 100);
        //        } else {
        //            $scope.usedServicePercent = 0;
        //        }
        //        if ($scope.quota.total_routes > 0) {
        //            $scope.usedRoutesPercent = Math.round(($scope.quota.total_routes / $scope.maxRoute) * 100);
        //        } else {
        //            $scope.usedRoutesPercent = 0;
        //        }
        //    })
        //};
            $scope.getSpace()
            //$scope.getSpaceInfo();


    }]);


app.controller('Spaceforname', [ '$rootScope', '$scope','$stateParams','$log',
    function($rootScope, $scope,$stateParams,$log) {
        $scope.space_name =$stateParams.spacename;

    }]);
