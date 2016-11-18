'use strict';

/* Controllers */

app
// Flot Chart controller
    .controller('FlotChartDemoCtrl', ['$scope','applicationService', 'organizationService','$q',function($scope,applicationService,organizationService,$q) {
        $scope.d = [ [1,6.5],[2,6.5],[3,7],[4,8],[5,7.5],[6,7],[7,6.8],[8,7],[9,7.2],[10,7],[11,6.8],[12,7] ];

        $scope.d0_1 = [ [0,100],[1,28],[2,18],[3,17],[4,10],[5,8],[6,5],[7,0],[8,0],[9,0] ];

        $scope.d0_2 = [ [0,8],[1,7],[2,7],[3,6],[4,5],[5,4],[6,3],[7,3],[8,3],[9,3] ];

        $scope.d1_1 = [ [10, 120], [20, 70], [30, 70], [40, 60] ];

        $scope.d1_2 = [ [10, 50],  [20, 60], [30, 90],  [40, 35] ];

        $scope.d1_3 = [ [10, 80],  [20, 40], [30, 30],  [40, 20] ];

        $scope.d2 = [];

        $scope.d5 =  [ [ 0, '信访局' ], [ 1, '国土厅' ], [ 2, '教育厅' ], [ 3, '扶贫办' ], [ 4, '文化厅' ], [ 5, '统计局' ], [ 6, '安监局' ], [ 7, '工商联' ], [ 8, '国资委' ], [ 9, '农科院' ] ];

        for (var i = 0; i < 20; ++i) {
            $scope.d2.push([i, Math.round( Math.sin(i)*100)/100] );
        }

        //应用状态的仪表盘
        $scope.nrOfStartedApps = 0;
        $scope.nrOfStoppedApps = 0;
        applicationService.getApplications().then(function(resp){
            var data = resp.data.resources;
            $scope.total = resp.data.total_results;
            angular.forEach(data,function(app,i){
                if(app.entity.state === 'STARTED'){
                    $scope.nrOfStartedApps++;
                }else{
                    $scope.nrOfStoppedApps++;
                }
            })
            $scope.startedAppPercent = ($scope.nrOfStartedApps/$scope.total) * 100;
            $scope.stoppedAppPercent = ($scope.nrOfStoppedApps/$scope.total) * 100;

            var startedpercent = $scope.startedAppPercent;
            var stoppedpercent = $scope.stoppedAppPercent;
            $scope.d3 = [
                { label: "运行中", data: startedpercent },
                { label: "已停止", data: stoppedpercent },
                /*{ label: "已删除", data: 16 },*/
            ];
        })


////////////////////////////////////////////////////////////// 组织应用和组织内存排名数据///////////////////////////////


        $scope.orgApps =[];
        $scope.orgMems = [];
        organizationService.getOrganizations().then(function(resp){
            var deferred = $q.defer();
            var promise = deferred.promise;

            var data = resp.data.resources;
            angular.forEach(data,function(org,i){
                //获取该组织下的应用数和占用内存数
                organizationService.getSpaceSummaryForTheOrganization(org.metadata.guid).then(function(res){
                    $scope.orgName = res.data.name;
                    $scope.appCount = 0;
                    $scope.appMem = 0;
                    var spacesMsg = res.data.spaces;
                    angular.forEach(spacesMsg,function(space,i){
                        $scope.appCount = $scope.appCount + space.app_count;
                        $scope.appMem = $scope.appMem + space.mem_dev_total;
                    })
                    $scope.orgApps.push([$scope.orgName,$scope.appCount]);
                    $scope.orgMems.push([$scope.orgName,$scope.appMem]);
                    if(i == data.length - 1){
                        deferred.resolve();
                    }
                })

            })

            promise.then(function(){
                var len = $scope.orgApps.length<10 ? $scope.orgApps.length : 10;
                var d =[];
                //数据填充在组织应用排名
                for(var i=0;i<len;i++){
                    for(var j=i;j<len;j++){
                        if($scope.orgApps[i][1]<$scope.orgApps[j][1]){
                            d = $scope.orgApps[j];
                            $scope.orgApps[i] = $scope.orgApps[j];
                            $scope.orgApps[j] = d;
                        }
                    }
                }

                $scope.d5_1 = [];
                $scope.d5_2 = [];
                //组织成d5_1 = [[0,'a'], [],[] ]  ,d5_2 = [[0,9], [1,8],[] ]
                for(var k=0;k<len;k++){
                    $scope.d5_1.push([k, $scope.orgApps[k][0]]);
                    $scope.d5_2.push([k, $scope.orgApps[k][1]]);
                }
                //数据填充在组织内存排名中
                for(var i=0;i<len;i++){
                    for(var j=i;j<len;j++){
                        if($scope.orgMems[i][1]<$scope.orgMems[j][1]){
                            d = $scope.orgMems[j];
                            $scope.orgMems[i] = $scope.orgMems[j];
                            $scope.orgMems[j] = d;
                        }
                    }
                }

                $scope.d5_3 = [];
                $scope.d5_4 = [];
                //组织成d5_1 = [[0,'a'], [],[] ]  ,d5_2 = [[0,9], [1,8],[] ]
                for(var k=0;k<len;k++){
                    $scope.d5_3.push([k, $scope.orgMems[k][0]]);
                    $scope.d5_4.push([k, $scope.orgMems[k][1]]);
                }

            })


        })
////////////////////////////////////////////////////////////应用实例排名////////////////////////////////////////
        $scope.appInstances =[];
        applicationService.getApplications().then(function(resp) {
            var data = resp.data.resources;
            angular.forEach(data, function (app, i) {
                $scope.appName = app.entity.name;
                $scope.Instance = app.entity.instances;
                $scope.appInstances.push([$scope.appName, $scope.Instance]);
            })

            var len = $scope.appInstances.length<10 ? $scope.appInstances.length : 10;
            var d =[];
            //数据填充在组织应用排名
            for(var i=0;i<len;i++){
                for(var j=i;j<len;j++){
                    if($scope.appInstances[i][1]<$scope.appInstances[j][1]){
                        d = $scope.appInstances[j];
                        $scope.appInstances[i] = $scope.appInstances[j];
                        $scope.appInstances[j] = d;
                    }
                }
            }

            $scope.d5_5 = [];
            $scope.d5_6 = [];
            //组织成d5_1 = [[0,'a'], [],[] ]  ,d5_2 = [[0,9], [1,8],[] ]
            for(var k=0;k<len;k++){
                $scope.d5_5.push([k, $scope.appInstances[k][0]]);
                $scope.d5_6.push([k, $scope.appInstances[k][1]]);
            }

        })


///////////////////////////////////////////////////////////////////////////////////////////////////////////////


        $scope.refreshData = function(){
            $scope.d0_1 = $scope.d0_2;
        };

        $scope.getRandomData = function() {
            var data = [],
                totalPoints = 150;
            if (data.length > 0)
                data = data.slice(1);
            while (data.length < totalPoints) {
                var prev = data.length > 0 ? data[data.length - 1] : 50,
                    y = prev + Math.random() * 10 - 5;
                if (y < 0) {
                    y = 0;
                } else if (y > 100) {
                    y = 100;
                }
                data.push(Math.round(y*100)/100);
            }
            // Zip the generated y values with the x values
            var res = [];
            for (var i = 0; i < data.length; ++i) {
                res.push([i, data[i]])
            }
            return res;
        }

        $scope.d4 = $scope.getRandomData();



    }]);
