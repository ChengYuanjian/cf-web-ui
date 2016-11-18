app.controller('AppDetailCtrl', function($rootScope, $scope, $modal, $log, notificationService,$stateParams,$filter,routeService,applicationService,organizationService,spaceService) {

    $scope.id = $stateParams.guid;
    $scope.currentOrg = $stateParams.org;
    $scope.currentSpace = $stateParams.space;
    $scope.organizations = [];
    $scope.spaces=[];

    //get all orgs
    $scope.getAllOrgs=function(){
        organizationService.getOrganizations().then(function(response) {
            var orgsdata = response.data;
            angular.forEach(orgsdata.resources, function (org, i) {
                var objectOrg = {
                    guid:org.metadata.guid,
                    id: org.metadata.guid,
                    name: org.entity.name
                };
                $scope.organizations.push(objectOrg);
            });
        });
    };

    //get space by one org
    $scope.getSpacesByOrg=function(selected_org) {
        $scope.currentSpace = null;
        $scope.currentOrg = null;
        if (selected_org == null) {
            return;
        }
        //reset var
        $scope.datas = [];
        $scope.spaces = [];
        organizationService.getSpacesForTheOrganization(selected_org.id).then(function (response) {
            var spacedata = response.data;
            angular.forEach(spacedata.resources, function (_spacedata) {
                var space = {
                    id: _spacedata.metadata.guid,
                    name: _spacedata.entity.name
                };
                $scope.spaces.push(space);
            });
        });
    };

    ////define vars
    //$scope.name='';
    //$scope.instances=0;
    //$scope.memory=0;
    //$scope.disk_quota=0;
    //$scope.appCreateTime='';
    //$scope.appUpdateTime='';
    //$scope.state='';
    //$scope.maxUptime=0;
    //$scope.sumMemRate=0;
    //$scope.sumDiskRate=0;

    $scope.getAppInfo = function () {
        applicationService.retrieveOneAPP($stateParams.guid).then(function (response) {
            var data = response.data;
            $scope.name = data.entity.name;
            $scope.instances = data.entity.instances;
            $scope.memory = data.entity.memory;
            $scope.disk_quota = data.entity.disk_quota;
            $scope.appCreateTime=data.metadata.created_at;
            $scope.appUpdateTime=data.metadata.updated_at;
            $scope.state=data.entity.state;

            applicationService.getInstances($stateParams.guid).then(function (response) {
                var data = response.data;
                var maxUptime;
                var _maxUptime=0;
                var sumMem=0;
                var sumDisK=0;
                angular.forEach(data,function(_data){
                    if(_maxUptime<_data.stats.uptime){_maxUptime=_data.stats.uptime}
                    //maxUptime = $filter('date')(1000*_maxUptime,"dd天HH小时mm分钟ss秒");
                    maxUptime=formatSeconds(_maxUptime);
                    sumMem = _data.stats.usage.mem+sumMem;
                    sumDisK = _data.stats.usage.disk+sumDisK;
                });

                $scope.maxUptime=maxUptime;
                $scope.sumMemRate= $filter('number')(sumMem*100/1024/1024/$scope.memory/$scope.instances,1);
                $scope.sumDiskRate=$filter('number')(sumDisK*100/1024/1024/$scope.disk_quota/$scope.instances,1);

                //$scope.sumMemRateuio="{percent:"+$scope.sumMemRate +",lineWidth: 10,trackColor: '#e8eff0',barColor: '#23b7e5',scaleColor: false,size: 158,rotate: 90,lineCap: 'butt'}";
                //$scope.sumDiskRateuio="{percent:"+$scope.sumDiskRate +",lineWidth: 10,trackColor: '#e8eff0',barColor: '#23b7e5',scaleColor: false,size: 158,rotate: 90,lineCap: 'butt'}";
                //var el=document.getElementById("memRate");
                //var value="{percent:"+$scope.sumMemRate +",lineWidth: 10,trackColor: '#e8eff0',barColor: '#23b7e5',scaleColor: false,size: 158,rotate: 90,lineCap: 'butt'}";
                //el.setAttribute('ui-options',value);
                //
                //var el1=document.getElementById("diskRate");
                //var value1="{percent:"+$scope.sumDiskRate +",lineWidth: 10,trackColor: '#e8eff0',barColor: '#23b7e5',scaleColor: false,size: 158,rotate: 90,lineCap: 'butt'}";
                //el1.setAttribute('ui-options',value1);

            }, function (err) {
                $log.error(err.data.description);
            });

        }, function (err) {
            $log.error(err.data.description);
        });
    };

    function formatSeconds(value) {
        var theTime = parseInt(value);// 秒
        var theTime1 = 0;// 分
        var theTime2 = 0;// 小时
        if(theTime > 60) {
            theTime1 = parseInt(theTime/60);
            theTime = parseInt(theTime%60);
            if(theTime1 > 60) {
                theTime2 = parseInt(theTime1/60);
                theTime1 = parseInt(theTime1%60);
            }
        }
        var result = ""+parseInt(theTime)+"秒";
        if(theTime1 > 0) {
            result = ""+parseInt(theTime1)+"分"+result;
        }
        if(theTime2 > 0) {
            result = ""+parseInt(theTime2)+"小时"+result;
        }
        return result;
    };

    $scope.appUpdate = function () {
        var spaceName = $scope.currentSpace;
        var spaceGuid = $stateParams.space_guid;
        if ($scope.selected_space) {
            spaceName = $scope.selected_space.name;
            spaceGuid = $scope.selected_space.id;
        }
        var appInfo = {
            guid: $stateParams.guid,
            name: $scope.name,
            memory: parseInt($scope.memory),
            instances: parseInt($scope.instances),
            disk_quota: parseInt($scope.disk_quota),
            space_guid: spaceGuid
        };
        applicationService.updateApp(appInfo).then(function (resp) {
            var data = resp.data;
            notificationService.success("修改应用成功！提示：内存和磁盘的修改需要在重新启动应用后生效！");
        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error('修改应用失败,原因是:\n' + err.data.description);
        });
    };

    $scope.reset = function () {
        $scope.currentOrg = $stateParams.org;
        $scope.currentSpace = $stateParams.space;
        $scope.getAppInfo();
    };


    //应用详情页面加载时给页面表单赋值
    $scope.getAppInfo();
    //加载组织列表信息
    $scope.getAllOrgs();

});


app.controller('Appforname', [ '$rootScope', '$scope','$stateParams','$log',
function($rootScope, $scope,$stateParams,$log) {
    $scope.app_name =$stateParams.name;

}]);

app.controller('appInstanceInfoCtl', function($rootScope, $scope,i18nService,$filter,$stateParams,$log,applicationService) {
    $scope.instances=[];
    $scope.upTime='';
    $scope.lastTime='';
    $scope.getAppInstances=function(){
        $scope.instances=[];
        applicationService.getInstances($stateParams.guid).then(function (response) {
            var data = response.data;
            angular.forEach(data,function(_data){
                //$scope.uptime = $filter('date')(_data.stats.uptime,"dd天HH小时mm分钟ss秒");
                $scope.uptime=formatSeconds(_data.stats.uptime);
                var memNumber = _data.stats.usage.mem;
                var diskNumber = _data.stats.usage.disk;
                var memNum = $filter('number')(memNumber/1024/1024,2)+"MB";
                var diskNum = $filter('number')(diskNumber/1024/1024,2)+"MB";
                var cpu=$filter('number')(_data.stats.usage.cpu,2)+'%';
                var instancesInfoObject = {
                    name: _data.stats.name,
                    host: _data.stats.host,
                    port: _data.stats.port,
                    cpu: cpu,
                    mem_usage: memNum,
                    disk_usage: diskNum,
                    createtime:_data.stats.usage.time,
                    uptime:$scope.uptime,
                    status:_data.state,
                    mem_quota:$filter('number')(_data.stats.mem_quota/1024/1024,0)+"MB",
                    disk_quota:$filter('number')(_data.stats.disk_quota/1024/1024,0)+"MB"
                };
                $scope.instances.push(instancesInfoObject);
                $scope.refresh();
            });
        }, function (err) {
            $log.error(err.data.description);
        });
    };

    function formatSeconds(value) {
        var theTime = parseInt(value);// 秒
        var theTime1 = 0;// 分
        var theTime2 = 0;// 小时
        if(theTime > 60) {
            theTime1 = parseInt(theTime/60);
            theTime = parseInt(theTime%60);
            if(theTime1 > 60) {
                theTime2 = parseInt(theTime1/60);
                theTime1 = parseInt(theTime1%60);
            }
        }
        var result = ""+parseInt(theTime)+"秒";
        if(theTime1 > 0) {
            result = ""+parseInt(theTime1)+"分"+result;
        }
        if(theTime2 > 0) {
            result = ""+parseInt(theTime2)+"小时"+result;
        }
        return result;
    };

    i18nService.setCurrentLang("zh-cn");

    $scope.instanceGridOptions = {
        data: $scope.instances,
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

    $scope.instanceGridOptions.columnDefs = [
        {name: 'guid', displayName: 'ID', visible: false},
        {name: 'host', displayName: '主机'},
        {name: 'port', displayName: '端口'},
        {name: 'cpu', displayName: '已使用CPU'},
        {name: 'mem_usage', displayName: '已使用内存'},
        {name: 'mem_quota', displayName:'内存配额'},
        {name: 'disk_usage', displayName: '已使用磁盘'},
        {name: 'disk_quota', displayName: '磁盘配额'},
        {name: 'createtime', displayName: '启动时间'},
        //{name: 'uptime', displayName: '运行时长'},
        {name: 'status', displayName: '状态'}
    ];

    $scope.instanceGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.refresh = function () {
        $scope.instanceGridOptions.data = $scope.instances;
        $scope.gridApi.core.refresh();
    };

    $scope.getAppInstances();

});


app.controller('appRouterGridCtl', function ($rootScope, $scope, i18nService, routeService, spaceService, organizationService, $filter, $stateParams, $log, uiGridConstants, dialogs, $confirm, applicationService, notificationService) {
    $scope.space_guid = $stateParams.space_guid;
    $scope.org_guid = $stateParams.org_guid;
    $scope.getAppRouters = function () {
        $scope.routers = [];
        routeService.getRoutesForApp($stateParams.guid).then(function (response) {
            var data = response.data;
            angular.forEach(data.resources, function (router, i) {
                    spaceService.getSpace($stateParams.space_guid).then(function (response) {
                        var spacename = response.data.entity.name;
                        $scope.org_guid = response.data.entity.organization_guid;
                        organizationService.getOrganization(response.data.entity.organization_guid).then(function (responses) {
                            var routerObject = {
                                guid: router.metadata.guid,
                                url: router.metadata.url,
                                host: router.entity.host,
                                port: router.entity.port,
                                name: $stateParams.name,
                                space_name: spacename,
                                org_name: responses.data.entity.name,
                                created_at: router.metadata.created_at,
                                updated_at: router.metadata.updated_at,
                            };
                            $scope.routers.push(routerObject);
                        }, function (err) {
                            $log.error(err.data.description);
                        });

                    }, function (err) {
                        $log.error(err.data.description);
                    });
                }
            );
            $scope.appRouterGridOptions.data = $scope.routers;
        }, function (err) {
            $log.error(err.data.description);
        });
    };
    $scope.getAppRouters();

    i18nService.setCurrentLang("zh-cn");

    $scope.appRouterGridOptions = {
        data: $scope.routers,
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


    $scope.appRouterGridOptions.columnDefs = [
        {name: 'guid', displayName: 'ID', visible: false},
        {name: 'host', displayName: '路由名称'},
        {name: 'name', displayName: '应用名称'},
        {name: 'space_name', displayName: '空间名称'},
        {name: 'org_name', displayName: '组织名称'},
        {name: 'port', displayName: '端口'},
        {
            name: 'created_at', displayName: '创建时间', sort: {
            direction: uiGridConstants.DESC,
            priority: 1,
        },
        },
        {
            name: 'updated_at', displayName: '更新时间', sort: {
            direction: uiGridConstants.DESC,
            priority: 0,
        },
        }
    ];

    $scope.appRouterGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.refresh = function () {
        $scope.getAppRouters();
    };

    $scope.delete = function () {
        if ($scope.gridApi.selection.getSelectedRows().length < 1)
            notificationService.info('请选择一条记录');
        else {
            $confirm({
                text: '请确认是否删除选择的' + $scope.gridApi.selection.getSelectedRows().length + '个路由?',
                title: "确认删除",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                angular.forEach($scope.gridApi.selection.getSelectedRows(), function (router, i) {
                    var item = {
                        guid: $stateParams.guid,
                        route_guid: router.guid,
                        host: router.host
                    };
                    applicationService.removerouteApplication(item).then(function (response) {
                        routeService.deleteRoute(router.guid).then(function (response) {
                            notificationService.success('删除路由[' + item.host + ']成功');
                            $scope.refresh();
                        });
                    }, function (err, status) {
                        $log.error(err);
                        if (err.data.code)
                            notificationService.error('删除路由[' + item.host + ']失败,原因是:\n' + err.data.description);
                    });
                });

            });
        }
    }

    $scope.create = function () {
        var data = {space_guid: $scope.space_guid, org_guid: $scope.org_guid, app_guid: $stateParams.guid};
        var dlg = dialogs.create('tpl/app_app_router_create.html', 'RouterCreateCtrl', data, 'default');
        dlg.result.then(function () {
            $scope.refresh();
        }, function () {
            notificationService.info('未作任何变更');
        });

        $scope.$watch('filter.filterRouter', function (newVal, oldVal) {
            if (newVal == oldVal)
                return;
            $scope.appRouterGridOptions.data = $scope.routers.filter(function (data) {
                if (data.host.toLowerCase().indexOf($scope.filter.filterBindedUser) > -1) {
                    return true;
                }
                else {
                    return false;
                }
            });

        }, true);
    };

});

app.controller('RouterCreateCtrl', ['$rootScope', '$scope', 'notificationService', 'applicationService', 'routeService', 'spaceService', 'organizationService', '$filter', '$stateParams', '$log', 'data', '$modalInstance', function ($rootScope, $scope, notificationService, applicationService, routeService, spaceService, organizationService, $filter, $stateParams, $log, data, $modalInstance) {
    var space_guid = data.space_guid;
    var org_guid = data.org_guid;
    var app_guid = data.app_guid;

    $scope.domains = [];

    organizationService.getSharedDomainsForTheOrganization().then(function (response) {
        var data = response.data;
        angular.forEach(data.resources, function (sharedDomain, i) {
            var sharedDomainObject = {
                id: sharedDomain.metadata.guid,
                name: sharedDomain.entity.name + "(共享域)",
                created_at: sharedDomain.metadata.created_at,
                updated_at: sharedDomain.metadata.updated_at,
                type: "共享域名",
            };
            $scope.domains.push(sharedDomainObject);
        });

        organizationService.getPrivateDomainsForTheOrganization(org_guid).then(function (response) {
            var data = response.data;
            angular.forEach(data.resources, function (sharedDomain, i) {
                var sharedDomainObject = {
                    id: sharedDomain.metadata.guid,
                    name: sharedDomain.entity.name + "(私有域)",
                    created_at: sharedDomain.metadata.created_at,
                    updated_at: sharedDomain.metadata.updated_at,
                    type: "私有域名",
                };
                $scope.domains.push(sharedDomainObject);

            });
        });
    });

    $scope.ok = function () {
        $scope.router.domainId = $scope.selected_domain.id;
        $scope.router.spaceId = space_guid;
        routeService.createRoute($scope.router).then(function (resp) {
            var routeId = resp.data.metadata.guid;
            var appId = app_guid;
            routeService.associateRouteWithApp(routeId, appId).then(function (response) {
                notificationService.success('创建路由成功');
                $modalInstance.close();
            }, function (err) {
                $log.error(err);
                if (err.data.code)
                    notificationService.error('创建路由失败,原因是:\n' + err.data.description);
                $modalInstance.dismiss('cancel');
            });
        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error('创建路由失败,原因是:\n' + err.data.description);
            $modalInstance.dismiss('cancel');
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


app.controller('appEnvInfoCtl', function ($rootScope, $confirm,notificationService,$scope, dialogs,i18nService, applicationService, routeService, spaceService, organizationService, $filter, $stateParams, $log) {

    $scope.appenvs = [];

    $scope.getAppEnvs = function () {
        $scope.appenvs = [];
        applicationService.getEnvironmentVariables($stateParams.guid).then(function (response) {
            var obj = response.data.environment_json;
            for (var key in obj) {
                var sharedDomainObject = {
                    name: key,
                    value: obj[key]
                };
                $scope.appenvs.push(sharedDomainObject);
            }
            $scope.refresh1();
        }, function (err) {
            $log.error(err.data.description);
        });
    };

    i18nService.setCurrentLang("zh-cn");

    $scope.appEnvGridOptions = {
        data: $scope.appenvs,
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

    $scope.$watch('filter.filterEnv', function (newVal, oldVal) {
        if (newVal == oldVal)
            return;
        $scope.appEnvGridOptions.data = $scope.appenvs.filter(function (data) {
            if (data.name) {
                if (data.name.toLowerCase().indexOf($scope.filter.filterEnv.toLowerCase()) > -1) {
                    return true;
                }
                else {
                    return false;
                }
            }
        });

    }, true);

    $scope.appEnvGridOptions.columnDefs = [
        //{name: 'guid', displayName: 'ID', visible: false},
        {name: 'name', displayName: '变量名称'},
        {name: 'value', displayName: '变量值'}
        //{name: 'des', displayName: '描述'}
    ];

    $scope.appEnvGridOptions.onRegisterApi = function (gridApi) {
        $scope.gridApi = gridApi;
    };

    $scope.refresh = function () {
        $scope.getAppEnvs();
    };

    $scope.refresh1 = function () {
        $scope.appEnvGridOptions.data = $scope.appenvs;
        $scope.gridApi.core.refresh();
    };

    $scope.delete=function() {
        if ($scope.gridApi.selection.getSelectedRows().length < 1)
            notificationService.info('请选择一条记录');
        else {
            $confirm({
                text: '请确认是否删除选择的' + $scope.gridApi.selection.getSelectedRows().length + '个环境变量',
                title: "确认删除",
                ok: "确认",
                cancel: '取消'
            }).then(function () {
                var envinfo = {};
                applicationService.getEnvironmentVariables($stateParams.guid).then(function (response) {
                    envinfo = response.data.environment_json;
                    angular.forEach($scope.gridApi.selection.getSelectedRows(), function (env, i) {
                        delete envinfo[env.name];
                    });
                    applicationService.updateAppEnv($stateParams.guid, envinfo).then(function (resp) {
                        notificationService.success("删除变量成功！变量在您重新启动应用后生效！");
                        $scope.refresh();
                    });
                });
            });
        }
    };

    $scope.create=function(){
        var param={
            appGuid:$stateParams.guid
        };
        var dlg = dialogs.create('tpl/app_app_env_create.html','appEnvCreCtl',param, 'default');
        dlg.result.then(function(){
            $scope.refresh();
        });
    };

    $scope.getAppEnvs();
});

app.controller('appEnvCreCtl', function ($rootScope, $scope, i18nService,$modalInstance, applicationService,notificationService, routeService,$log,data) {
    var envinfo={};
    //envinfo['test']='mas';
    //envinfo['test']='mas1';
    //delete envinfo['test'];
    $scope.addAppEnvs = function () {
        applicationService.getEnvironmentVariables(data.appGuid).then(function (response) {
            var obj = response.data.environment_json;
            for (var key in obj) {
                if($scope.envname===key){
                    notificationService.info("变量名称与现有环境变量重复，请重新输入！");
                    return;
                }
            }
            obj[$scope.envname]=$scope.envvalue;
            envinfo=obj;
            applicationService.updateAppEnv(data.appGuid,envinfo).then(function(resp){
                notificationService.success("添加变量成功！变量在您重新启动应用后生效！");
                $modalInstance.close();
            });
        }, function (err) {
            $log.error(err);
            if (err.data.code)
                notificationService.error('添加变量[' + $scope.envname + ']失败,原因是:\n' + err.data.description);
        });
    };

    $scope.ok=function(){
      $scope.addAppEnvs();
    };

    $scope.cancel=function(){
        $modalInstance.dismiss('cancel');
    };
});
